(() => {
  let saved = null;
  function active() {
    let el = document.activeElement;
    while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
    return el;
  }
  function editable(el) {
    return !!el && !el.disabled && !el.readOnly && (el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && ['text','search','url','tel','email'].includes(el.type)) || el.isContentEditable);
  }
  function announce(event) {
    const el = event?.composedPath?.()[0] || active();
    if (editable(el)) chrome.runtime.sendMessage({type:'FOCUSED'}).catch(() => {});
  }
  document.addEventListener('focusin', announce, true);
  document.addEventListener('pointerup', announce, true);
  if (editable(active())) announce();
  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (message.type === 'CAPTURE') {
      const el = active();
      if (!editable(el)) { reply({ok:false,error:'Click an editable text field first, then open Hindi Type.'}); return; }
      const selection = window.getSelection();
      let range = null;
      if (el.isContentEditable && selection?.rangeCount && el.contains(selection.getRangeAt(0).commonAncestorContainer)) range = selection.getRangeAt(0).cloneRange();
      saved = {el, token:crypto.randomUUID(), start:el.selectionStart, end:el.selectionEnd, range};
      reply({ok:true,token:saved.token,label:el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.tagName.toLowerCase()});
    }
    if (message.type === 'INSERT') {
      try {
        if (!saved || saved.token !== message.token || !saved.el.isConnected || !editable(saved.el)) throw Error('The original field changed. Close the popup, click the field again, and reopen it.');
        const {el,range,start,end} = saved;
        const text = message.text;
        if (typeof text !== 'string' || !text.trim()) throw Error('Enter Hindi text to insert.');
        if (!el.isContentEditable && el.maxLength >= 0 && el.value.length - (end-start) + text.length > el.maxLength) throw Error('The Hindi text exceeds this field’s character limit. Shorten the preview.');
        el.focus();
        if (el.isContentEditable) {
          const selection = window.getSelection();
          selection.removeAllRanges();
          if (range && el.contains(range.commonAncestorContainer)) selection.addRange(range);
          else { const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); selection.addRange(r); }
        } else if (start !== null) el.setSelectionRange(start,end);
        // Native editing preserves undo and emits input for most normal editors.
        const before = el.isContentEditable ? el.innerHTML : el.value;
        const inserted = document.execCommand('insertText', false, text);
        const after = el.isContentEditable ? el.innerHTML : el.value;
        if (!inserted && before === after) {
          if (el.isContentEditable) throw Error('This editor blocked insertion. Use Copy Hindi and paste instead.');
          const next = el.value.slice(0,start ?? el.value.length) + text + el.value.slice(end ?? el.value.length);
          const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          Object.getOwnPropertyDescriptor(proto,'value').set.call(el,next);
          if (start !== null) el.setSelectionRange(start+text.length,start+text.length);
          el.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true,inputType:'insertText',data:text}));
        }
        // Do not submit the form, press Enter, or dispatch fabricated keyboard events.
        saved = null;
        reply({ok:true});
      } catch(error) { reply({ok:false,error:error.message}); }
    }
  });
})();
