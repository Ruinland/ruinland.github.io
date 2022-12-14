/*
  Ajax IME: http://ajaxime.chasen.org/
  Author: Taku Kudo <taku@chasen.org>
  Modified by Ichinose Shogo <shogo82148@gmail.com>

  (C) Taku Kudo, all rights reserve rd.
  Personal use only!
*/

//////////////////////////////////////////////////////////////////////////////////////////

//
// Comment by kazawa
// We cannot simply define getComputedStyle() in "if" block because it seems
// like Safari overwrites functions during parsing the script i.e, before
// execution (bug?). So we substitue it at run time instead.
//
// *** TESTED ONLY ON Firefox3 AND Safari3 ***
//
if (typeof(getComputedStyle) == 'undefined') {
  function capitalize(prop) {
    return prop.replace(/-(.)/g, function(m, m1) { return m1.toUpperCase(); })
  }
  getComputedStyle = function(element, pseudo){
    return {
      currentStyle : element.currentStyle,
        getPropertyValue : function(prop){
        return this.currentStyle[capitalize(prop)];
      },
        setProperty : function(prop, value){
          this.currentStyle[capitalize(prop)] = value;
        }
     }
  }

//  getComputedStyle == __getComputedStyle;
}

function JSONRequest(url) {
  this.url_ = url;
  this.parent_ = document.getElementsByTagName('head').item(0);
  this.obj_ = document.createElement('script');
  this.obj_.setAttribute('type', 'text/javascript');
  this.obj_.setAttribute('charset', 'utf-8');
  this.obj_.setAttribute('src', this.url_);
  this.parent_.appendChild(this.obj_);
}

JSONRequest.prototype.remove = function () {
  this.parent_.removeChild(this.obj_);
}

function getEvent (evt) {
  return (evt) ? evt : ((window.event) ? event : null);
}

function getKeyCode(event) {
  var evt = getEvent(event);
  return ((evt.which) ? evt.which : evt.keyCode);
}

function callWithDelay(func, delay) {
  if (delay) setTimeout(func, 0);
  else func();
}

function addEvent(obj, event, func) {
  if (obj.addEventListener) {
    obj.addEventListener(event, func, false);
  } else if(obj.attachEvent){
    obj.attachEvent('on' + event, func);
  } else {
  }
}

function copyFontStyle(elmOriginal, elmClone) {
  var styleOriginal = getComputedStyle(elmOriginal,'');
  var styleClone = getComputedStyle(elmClone,'');
  elmClone.style["fontFamily"] = styleOriginal.getPropertyValue("font-family");
  elmClone.style["fontSize"] = styleOriginal.getPropertyValue("font-size");
  elmClone.style["fontWeight"] = styleOriginal.getPropertyValue('font-weight');
  elmClone.style["fontVariant"] = styleOriginal.getPropertyValue('font-variant');
}

function cloneElement(elmOriginal, elmClone) {
  var styleOriginal = getComputedStyle(elmOriginal,'');

  var styleClone = getComputedStyle(elmClone,'');
  elmClone.style.left = elmOriginal.offsetLeft + 'px';
  elmClone.style.top = (elmOriginal.offsetTop + elmOriginal.offsetHeight + 30) + 'px';

  elmClone.style["width"] =  styleOriginal.getPropertyValue('width');
  elmClone.style["height"] =  styleOriginal.getPropertyValue('height');
  elmClone.style["padding"] =  styleOriginal.getPropertyValue('padding');
  elmClone.style["paddingLeft"] =  styleOriginal.getPropertyValue('padding-left');
  elmClone.style["paddingRight"] =  styleOriginal.getPropertyValue('padding-right');
  elmClone.style["paddingTop"] =  styleOriginal.getPropertyValue('padding-top');
  elmClone.style["paddingBottom"] =  styleOriginal.getPropertyValue('padding-bottom');
  elmClone.style["borderStyle"] =  styleOriginal.getPropertyValue('border-style');
  elmClone.style["borderLeftStyle"] =  styleOriginal.getPropertyValue('border-left-style');
  elmClone.style["borderRightStyle"] =  styleOriginal.getPropertyValue('border-right-style');
  elmClone.style["borderTopStyle"] =  styleOriginal.getPropertyValue('border-top-style');
  elmClone.style["borderBottomStyle"] =  styleOriginal.getPropertyValue('border-bottom-style');
  elmClone.style["borderLeftWidth"] =  styleOriginal.getPropertyValue('border-left-width');
  elmClone.style["borderRightWidth"] =  styleOriginal.getPropertyValue('border-right-width');
  elmClone.style["borderTopWidth"] =  styleOriginal.getPropertyValue('border-top-width');
  elmClone.style["borderBottomWidth"] =  styleOriginal.getPropertyValue('border-bottom-width');
  elmClone.style["borderWidth"] =  styleOriginal.getPropertyValue('border-width');
  elmClone.style["fontFamily"] =  styleOriginal.getPropertyValue('font-family');
  elmClone.style["fontSize"] =  styleOriginal.getPropertyValue('font-size');
  elmClone.style["fontVariant"] =  styleOriginal.getPropertyValue('font-variant');
  elmClone.style["fontWeight"] =  styleOriginal.getPropertyValue('font-weight');
  elmClone.style["lineHeight"] =  styleOriginal.getPropertyValue('line-height');
  elmClone.style["letterSpacing"] =  styleOriginal.getPropertyValue('letter-spacing');
  elmClone.style["wordSpacing"] =  styleOriginal.getPropertyValue('word-spacing');
  elmClone.style.width = elmOriginal.offsetWidth;
  elmClone.style.height = elmOriginal.offsetHeight;
  elmClone.scrollLeft = elmOriginal.scrollLeft;
  elmClone.scrollTop = elmOriginal.scrollTop;
}

//////////////////////////////////////////////////////////////////////////////////////////
var post;
var ImeBackGroundColor_ = 'aliceblue';
var ImeID_ = 0;
var ImeCache_ = [];
var ImeCurrentDocument_ = null;

function AjaxIME(doc) {
  var ImeJsonp_ = null;
  var ImeJsonpLog_ = null;
  var ImeDocument_ = doc;
  var ImeMode_ = null;
  var ImeResults_ = [];
  var ImeTo_ = 0;
  var ImeNumResults_ = 0;
  var ImeLoaded_ = false;
  var ImeCandidates_ = null;
  var ImePreEdit_ = null;
  var ImePreEditWidth_ = 0;
  var ImeWindow_ = null;
  var ImeTextArea_ = null;
  var ImeTextAreaClone_ = null;
  var ImeSelectedIndex_ = -1;
  var ImeStartPos_ = 0;
  var ImeEndPos_ = 0;

  // initializer
  {
    if (ImeLoaded_) return;
    ImeWindow_ = ImeDocument_.createElement('div');
    ImePreEdit_ = ImeDocument_.createElement('input');
    ImePreEdit_.setAttribute('type', 'text');
    ImePreEdit_.setAttribute('autocomplete', 'off');
    ImeCandidates_ = ImeDocument_.createElement('div');
    ImeTextAreaClone_ = ImeDocument_.createElement('pre');
    ImePreEdit_.__ImeUsed = ImeTextAreaClone_.__ImeUsed = true;
    ImeWindow_.appendChild(ImePreEdit_);
    ImeWindow_.appendChild(ImeCandidates_);
    ImeDocument_.body.appendChild(ImeWindow_);

    ImeWindow_.style.position = 'absolute';
    ImeWindow_.style.margin = '0px';
    ImeWindow_.style.padding = '0px';
    ImeWindow_.style.textAlign = 'left';
    ImePreEdit_.style.backgroundColor = ImeBackGroundColor_;
    ImePreEdit_.style.borderWidth = '0px';
    ImePreEdit_.style.textDecoration = 'underline';
    ImePreEdit_.style.textUnderLineColor = 'red';
    ImePreEdit_.style.textAlign = 'left';
    ImePreEdit_.style.outline = 'none';
    ImePreEdit_.style.margin = '0px';
    
    ImeCandidates_.style.padding = '0px';
    ImeCandidates_.style.borderColor = '#000';
    ImeCandidates_.style.borderWidth = '1px';
    ImeCandidates_.style.borderStyle = 'solid';
    ImeCandidates_.style.styleFloat = 'left'; // IE
    ImeCandidates_.style.cssFloat = 'left'; // Firefox
    ImeCandidates_.style.textAlign = 'left';

    ImeDocument_.ImeRequestCallback = ImeRequestCallback;
    ImeDocument_.ImeChangeMode = ImeChangeMode;

    addEvent(ImeDocument_, 'keydown', ImeDocumentKeyDown);
    addEvent(ImePreEdit_,  'keydown', ImePreEditKeyDown);
    addEvent(ImePreEdit_,  'keyup',   ImePreEditKeyUp);
  
    setInterval(ImeInitTextAreas, 500);
    ImeLoaded_ = true;

    ImeHide();
  }

  function ImeInitTextAreas() {
    var inputs = ImeDocument_.getElementsByTagName('input');
    for (var i = 0; i < inputs.length; ++i) {
      if (inputs[i].type == 'text') ImeInitTextAreaEvent(inputs[i]);
    }

    var textareas = ImeDocument_.getElementsByTagName('textarea');
    for (var i = 0; i < textareas.length; ++i) {
      ImeInitTextAreaEvent(textareas[i]);
    }
  }

  function ImeInitTextAreaEvent(textarea) {
    if (!textarea.__ImeUsed && !textarea.__ImeRegistered) {
      addEvent(textarea, 'keydown', ImeTextAreaKeyDown);
      addEvent(textarea, 'click',   ImeHide);
      textarea.__ImeRegistered = true;
    }
  }

  function ImeSetCaretPos(pos) {
    if (ImeTextArea_.setSelectionRange) { // Mozilla
      ImeTextArea_.setSelectionRange(pos, pos);
    } else if (ImeDocument_.selection.createRange ){ // IE
      var e = ImeTextArea_.createTextRange();
      var tx = ImeTextArea_.value.substr(0, pos);
      var pl = tx.split(/\n/);
      e.collapse(true);
      e.moveStart('character', pos - pl.length + 1);
      e.collapse(false);
      e.select();
    }
    ImeTextArea_.focus();
  }

  function ImeStoreCaretPos() {
    var startpos = 0;
    var endpos = 0;
    if (ImeTextArea_.setSelectionRange) { // mozilla
      startpos = ImeTextArea_.selectionStart;
      endpos = ImeTextArea_.selectionEnd;
    } else if (ImeDocument_.selection.createRange) { // IE
      if (ImeTextArea_.type == 'textarea') {
        ImeTextArea_.caretPos = ImeDocument_.selection.createRange().duplicate();
        var sel = ImeDocument_.selection.createRange();
        var r = ImeTextArea_.createTextRange();
        var len = ImeTextArea_.value.length;
        r.moveToPoint(sel.offsetLeft, sel.offsetTop);
        r.moveEnd('textedit');
        startpos = len - r.text.length
          endpos = startpos +  sel.text.length;
      } else {
        var r = ImeDocument_.selection.createRange();
        var len = ImeTextArea_.value.length;
        r.moveEnd('textedit');
        startpos = len - r.text.length
          endpos = startpos;
      }
    }
    ImeStartPos_ = startpos;
    ImeEndPos_ = endpos;
  }

  function ImeStoreWindowPos() {
    var x = 0;
    var y = 0;
    var x2 = ImeDocument_.body.scrollTop;
    var y2 = ImeDocument_.body.scrollLeft;

    if (! ImeTextArea_.createTextRange || ImeTextArea_.type != 'textarea') {
      for (var o = ImeTextArea_; o ; o = o.offsetParent) {
        x2 += (o.offsetLeft - o.scrollLeft);
        y2 += (o.offsetTop - o.scrollTop);
      }
    }

    if (ImeTextArea_.selectionStart || ImeTextArea_.selectionStart == '0') { // Mozilla
      cloneElement(ImeTextArea_, ImeTextAreaClone_);
      ImeTextArea_.offsetParent.appendChild(ImeTextAreaClone_);
      var value = ImeTextArea_.value.replace(/\r\n/g, '\n\r') + ' ';
      var caretPos = ImeDocument_.createElement('span');
      caretPos.innerHTML = '|';
      ImeTextAreaClone_.innerHTML = '';
      ImeTextAreaClone_.appendChild(ImeDocument_.createTextNode(value.substr(0,ImeStartPos_)));
      ImeTextAreaClone_.appendChild(caretPos);
      ImeTextAreaClone_.appendChild(ImeDocument_.createTextNode(value.substr(ImeStartPos_)));
      y = y2 + (caretPos.offsetTop - ImeTextAreaClone_.offsetTop);
      x = x2 + (caretPos.offsetLeft - ImeTextAreaClone_.offsetLeft);
      ImeTextArea_.offsetParent.removeChild(ImeTextAreaClone_);
    } else {
      var caretPos = ImeDocument_.selection.createRange();
      y = y2 + (caretPos.offsetTop + ImeDocument_.documentElement.scrollTop - 3); // why -3 ??
      x = x2 + (caretPos.offsetLeft + ImeDocument_.documentElement.scrollLeft);
    }

    ImeWindow_.style.top = y + 'px';
    ImeWindow_.style.left = x + 'px';
  }

  function ImeInsertText(text, delay) {
    var func = function() { ImeSetCaretPos(ImeStartPos_ + text.length); }

    if (ImeTextArea_.createTextRange && ImeTextArea_.caretPos) {
      var caretPos = ImeTextArea_.caretPos;
      caretPos.text = caretPos.text.charAt(caretPos.text.length - 1) == ' ' ?
        text  + ' ' : text;
      callWithDelay(func, delay);
    } else {
      var tmpTop = ImeTextArea_.scrollTop;
      var tmpLeft = ImeTextArea_.scrollLeft;
      ImeTextArea_.value = ImeTextArea_.value.substring(0, ImeStartPos_) +
        text + ImeTextArea_.value.substring(ImeEndPos_, ImeTextArea_.value.length);
      callWithDelay(func, delay);
      ImeTextArea_.scrollTop = tmpTop;
      ImeTextArea_.scrollLeft = tmpLeft;
    }
  }

  function ImeAdd(text, selected) {
    if (text == '') return;
  
    if (selected) ImeSelectedIndex_ = ImeNumResults_;

    var n = ImeNumResults_;
    ImeResults_[ImeNumResults_++] = text;

    if (text.length > ImePreEditWidth_)
      ImePreEditWidth_ = text.length;

    var div = ImeDocument_.createElement('div');
    div.style.width = '100%';
    div.style.styleFloat = 'left';
    div.style.cssFloat = 'left';
    if (selected) {
      div.style.backgroundColor = '#36c';
      div.style.color = '#fff';
    } else {
      div.style.backgroundColor = '#fff';
      div.style.color = '#000';
    }

    var txt = ImeDocument_.createTextNode(text);
    var span = ImeDocument_.createElement('span');
    span.appendChild(txt);
    copyFontStyle(ImeTextArea_, span);
    addEvent(div, 'click', function() {
      ImeSelectedIndex_ = n; ImeSelect(true);  ImeHide(); });
    div.appendChild(span);
    ImeCandidates_.appendChild(div);
  }

  function ImeHandleDown() {
    if (ImeIsHidden()) return;
    ++ImeSelectedIndex_;
    if (ImeSelectedIndex_ == ImeNumResults_) ImeSelectedIndex_ = 0;
    ImeHighlight();
  }

  function ImeHandleUp() {
    if (ImeIsHidden()) return;
    --ImeSelectedIndex_;
    if (ImeSelectedIndex_ < 0) ImeSelectedIndex = ImeNumResults_ - 1;
    ImeHighlight();
  }

  function ImeHighlight() {
    var divs = ImeCandidates_.getElementsByTagName('div');
    for (var i = 0; i < divs.length; ++i) {
      if (i == ImeSelectedIndex_) {
        ImePreEdit_.value = ImeResults_[i];
        divs[i].style.backgroundColor = '#36c';
        divs[i].style.color = '#fff';
      } else {
        divs[i].style.backgroundColor = '#fff';
        divs[i].style.color = '#000';
      }
    }
  }

  function ImeNop() {
    ImeInsertText('', false);
  }

  function ImeSelect(delay) {
    var result = ImeResults_.length ? ImeResults_[ImeSelectedIndex_] : ImePreEdit_.value;
    ImeInsertText(result, delay);
  }

  function ImeIsHidden() {
    return (ImeCandidates_.style.display == 'none');
  }

  function ImeHideCandidates() {
    ImeCandidates_.style.display = 'none';
    ImeCandidates_.innerHTML = '';
  }

  function ImeHide() {
    ImeWindow_.style.display = 'none';
    ImePreEdit_.style.display = 'none';
    ImeHideCandidates();
    ImeClear();
  }

  function ImeClear() {
    ImeClearPreEdit();
    ImeClearResults();
  }

  function ImeClearPreEdit() {
    ImePreEdit_.value = '';
    ImePreEditWidth_ = 0;
    ImeRawInput_ = '';
    ImeTo_ = "ime";
  }

  function ImeClearResults() {
    ImeSelectedIndex_ = -1;
    ImeNumResults_ = 0;
    ImeResults_ = [];
  }

  function ImeShow() {
    ImePreEdit_.style.display = 'block';
    ImeWindow_.style.display = 'block';
  }

  function ImeShowPreEdit() {
    ImeStoreCaretPos();
    ImeStoreWindowPos();
    ImeHide();
    ImeShow();
    ImePreEdit_.focus();
  }

  function ImeRequestCallback(result) {
    try {
      ImeClearResults();
      var c = ImeCache_[ImeRawInput_];
      if (c) {
        ImeAdd(c, 1);
        for (var i = 0; i < result.length; i++) {
          if (result[i] != c) ImeAdd(result[i], 0);
        }
      } else {
        for (var i = 0; i < result.length; i++) {
          ImeAdd(result[i], i == 0 ? 1 : 0);
        }
      }
      if (ImeResults_.length) ImePreEdit_.value = ImeResults_[0];
      if (ImeRawInput_ == '') ImeRawInput_ = roma2hiragana(ImePreEdit_.value, false);
      ImeCandidates_.style.display = 'block';
      if (ImeJsonp_) ImeJsonp_.remove();
    } catch (e) {}
  }

  function ImeShowCandidates() {
    if (!ImeIsHidden()) return;
    if (ImeRawInput_ == '') ImeRawInput_ = roma2hiragana(ImePreEdit_.value, false);
    ImeCurrentDocument_ = ImeDocument_;
    post({method: 'parseNBest', text: ImeRawInput_, best: 20});
  }

  function ImePreEditKeyDown(event)  {
    if (!ImeMode_) return false;

    var evt = getEvent(event);
    var key = getKeyCode(event);

    ImePreEdit_.focus();
    if (key == 0x20) { // space
      ImeTo_ = "ime";
      if (ImeIsHidden())
        ImeShowCandidates();
      else
        ImeHandleDown();
    } else if (key == 120) { // F9 katakana
      ImeTo_ = "katakana";
      ImeHideCandidates();
      ImeShowCandidates();
    } else if (key == 119) { // F9 roma
      ImeTo_ = "alpha";
      ImeHideCandidates();
      ImeShowCandidates();
    } else if (key == 40) { // down
      ImeHandleDown();
    } else if (key == 38) { // up
      ImeHandleUp();
    } else if (key == 13) { // return
      ImeSelect(true);
      ImeHide();
    } else if (key == 27) {  // esc, delete, bs
      ImeNop();
      ImeHide();
    } else if (! ImeIsHidden()) { // next word
      ImeSelect(false);
      ImeStartPos_ += ImePreEdit_.value.length;
      ImeSetCaretPos(ImeStartPos_);
      ImeStoreWindowPos();
      ImeStoreCaretPos();
      ImeHideCandidates();
      ImeClear();
      ImePreEdit_.focus();
    }

    return false;
  }

  function ImePreEditKeyUp(event) {
    if (ImePreEdit_.value.length == 0) {
      ImeHide();
      ImeNop();
      return false;
    }

    ImePreEdit_.value = roma2hiragana(ImePreEdit_.value, true);

    if (ImePreEdit_.value.length > ImePreEditWidth_)
      ImePreEditWidth_ = ImePreEdit_.value.length;

    var fontsize = parseFloat(getComputedStyle(ImeTextArea_, '').getPropertyValue('font-size'));

    var length = (1.5 * fontsize * (ImePreEditWidth_ + 1)) + 'px';
    ImePreEdit_.style.width = length;
    ImeWindow_.style.width = length;
    ImeCandidates_.style.width = length;

    return true;
  }

  function ImeChangeMode() {
    ImeMode_ = !ImeMode_;
    ImeHide();

    var inputs = ImeDocument_.getElementsByTagName('input');
     for (var i = 0; i < inputs.length; ++i) {
       if (!inputs[i].__ImeUsed && inputs[i].type == 'text') {
        inputs[i].style.backgroundColor = ImeMode_ ? ImeBackGroundColor_ : 'white';
      }
    }

    var textareas = ImeDocument_.getElementsByTagName('textarea');
    for (var i = 0; i < textareas.length; ++i) {
      if (!textareas[i].__ImeUsed)
        textareas[i].style.backgroundColor = ImeMode_ ? ImeBackGroundColor_ : 'white';
    }
  }

  function ImeDocumentKeyDown(event) {
    var evt = getEvent(event);
    var key = getKeyCode(event);
    if ((key == 79 && evt.altKey) || ((key == 57 || key == 81) && evt.ctrlKey)) {
      ImeChangeMode();
      return false;
    }
    return true;
  }

  function ImeTextAreaKeyDown(event) {
    var evt = getEvent(event);
    var key = getKeyCode(event);

    ImeTextArea_ = evt.target || evt.srcElement;

    copyFontStyle(ImeTextArea_, ImePreEdit_);

    if (ImeMode_) ImeHide();

    // ignore Ctrl+C
    if (evt.ctrlKey || evt.altKey) return true;

    if (ImeMode_ && ImeIsHidden() &&
        ((key >= 65 && key <= 90) ||
         (key >= 48 && key <= 57) || (key >= 187 && key <= 222))) {

      ImeShowPreEdit();
      return false;
    }

    return true;
  }
}

// roma 2 hiragana
function roma2hiragana(str, delay) {
  var result = [];
  var text = str;
  var rem = '';

  if (delay) {
    var l = str.length;
    var last  = str.substr(l - 1, 1);
    var last2 = str.substr(l - 2, 2);
    if (l > 1 && last2 == 'nn') {
      text = str;
      rem = '';
    } else if (l > 1 && last2.match(/^[qwrtyplkjhgfdszxcvbmn]y$/)) {
      text = str.substr(0, l - 2);
      rem = last2;
    } else if (l > 0 && last.match(/[qwrtyplkjhgfdszxcvbmn]/)) {
      text = str.substr(0, l - 1);
      rem = last;
    }
  }
  
  for (var i = 0; i < text.length;) {
    var o = text.charAt(i);
    var c = o.charCodeAt(0);
    var len = 0;
    if ((c >= 97 && c <= 122) || (c >= 65 && c <= 90) || (c >= 44 && c <= 46)) 
      len = 4;
    while (len) {
      var key = text.slice(i, i + len);
      if (key in IMERoma2KatakanaTable_) {
        var kana = IMERoma2KatakanaTable_[key];
        if (typeof(kana) == 'string') {
          result.push(kana);
          i += len;
        } else {
          result.push(kana[0]);
          i += (len - kana[1]);
        }
        break;
      }
      --len;
    }
    
    if (len == 0) {
      result.push(o);
      ++i;
    }
  }
  
  return result.join("") + rem;
}

IMERoma2KatakanaTable_ = {'.':'???',',':'???','-':'???','~':'???','va':'?????????','vi':'?????????','vu':'??????','ve':'?????????','vo':'?????????','vv': ['???',1],'xx': ['???',1],'kk': ['???',1],'gg': ['???',1],'ss': ['???',1],'zz': ['???',1],'jj': ['???',1],'tt': ['???',1],'dd': ['???',1],'hh': ['???',1],'ff': ['???',1],'bb': ['???',1],'pp': ['???',1],'mm': ['???',1],'yy': ['???',1],'rr': ['???',1],'ww': ['???',1],'cc': ['???',1],'kya':'??????','kyi':'??????','kyu':'??????','kye':'??????','kyo':'??????','gya':'??????','gyi':'??????','gyu':'??????','gye':'??????','gyo':'??????','sya':'??????','syi':'??????','syu':'??????','sye':'??????','syo':'??????','sha':'??????','shi':'???','shu':'??????','she':'??????','sho':'??????','zya':'??????','zyi':'??????','zyu':'??????','zye':'??????','zyo':'??????','tya':'??????','tyi':'??????','tyu':'??????','tye':'??????','tyo':'??????','cha':'??????','chi':'???','chu':'??????','che':'??????','cho':'??????','dya':'??????','dyi':'??????','dyu':'??????','dye':'??????','dyo':'??????','tha':'??????','thi':'??????','thu':'??????','the':'??????','tho':'??????','dha':'??????','dhi':'??????','dhu':'??????','dhe':'??????','dho':'??????','nya':'??????','nyi':'??????','nyu':'??????','nye':'??????','nyo':'??????','jya':'??????','jyi':'???','jyu':'??????','jye':'??????','jyo':'??????','hya':'??????','hyi':'??????','hyu':'??????','hye':'??????','hyo':'??????','bya':'??????','byi':'??????','byu':'??????','bye':'??????','byo':'??????','pya':'??????','pyi':'??????','pyu':'??????','pye':'??????','pyo':'??????','fa':'??????','fi':'??????','fu':'???','fe':'??????','fo':'??????','mya':'??????','myi':'??????','myu':'??????','mye':'??????','myo':'??????','rya':'??????','ryi':'??????','ryu':'??????','rye':'??????','ryo':'??????','n\'':'???','nn':'???','n':'???','a':'???','i':'???','u':'???','e':'???','o':'???','xa':'???','xi':'???','xu':'???','xe':'???','xo':'???','la':'???','li':'???','lu':'???','le':'???','lo':'???','ka':'???','ki':'???','ku':'???','ke':'???','ko':'???','ga':'???','gi':'???','gu':'???','ge':'???','go':'???','sa':'???','si':'???','su':'???','se':'???','so':'???','za':'???','zi':'???','zu':'???','ze':'???','zo':'???','ja':'??????','ji':'???','ju':'??????','je':'??????','jo':'??????','ta':'???','ti':'???','tu':'???','tsu':'???','te':'???','to':'???','da':'???','di':'???','du':'???','de':'???','do':'???','xtu':'???','xtsu':'???','na':'???','ni':'???','nu':'???','ne':'???','no':'???','ha':'???','hi':'???','hu':'???','fu':'???','he':'???','ho':'???','ba':'???','bi':'???','bu':'???','be':'???','bo':'???','pa':'???','pi':'???','pu':'???','pe':'???','po':'???','ma':'???','mi':'???','mu':'???','me':'???','mo':'???','xya':'???','ya':'???','xyu':'???','yu':'???','xyo':'???','yo':'???','ra':'???','ri':'???','ru':'???','re':'???','ro':'???','xwa':'???','wa':'???','wi':'??????','we':'??????','wo':'???'};

// global functions
function ImeInit() {
  function ImeInitRecursive(w) {
    var frames = w.frames;
    for (var i = 0; i < frames.length; ++i) {
      AjaxIME(frames[i].document);
      ImeInitRecursive(frames[i].window);
    }
  }
  AjaxIME(document);
  ImeInitRecursive(window);
}

function ImeChangeMode() {
  function ImeChangeModeRecursive(w) {
    var frames = w.frames;
    for (var i = 0; i < frames.length; ++i) {
      frames[i].document.ImeChangeMode();
      ImeChangeModeRecursive(frames[i].window);
    }
  }
  if(document.ImeChangeMode) document.ImeChangeMode();
  ImeChangeModeRecursive(window);
}

function ImeRequestCallback(result) {
  ImeCurrentDocument_.ImeRequestCallback(result);
}

addEvent(window, 'load', ImeInit);
