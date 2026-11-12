chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message.type === 'FOCUSED' && sender.tab) {
    chrome.storage.session.set({['target:' + sender.tab.id]: {frameId: sender.frameId, at: Date.now()}});
    return;
  }
  if (message.type === 'TRANSLATE' && sender.url === chrome.runtime.getURL('popup.html')) {
    (async () => {
      try {
        if (typeof message.text !== 'string' || !message.text.trim() || message.text.length > 5000) throw Error('Enter between 1 and 5,000 characters.');
        const url = new URL('https://translate.googleapis.com/translate_a/single');
        for (const [key, value] of Object.entries({client:'gtx', sl:'en', tl:'hi', dt:'t', q:message.text})) url.searchParams.set(key,value);
        const response = await fetch(url, {signal: AbortSignal.timeout(15000), credentials:'omit', cache:'no-store'});
        if (!response.ok) throw Error('Translation service unavailable (' + response.status + '). Try again later.');
        const data = await response.json();
        const text = Array.isArray(data[0]) ? data[0].map(part => typeof part[0] === 'string' ? part[0] : '').join('') : '';
        if (!text.trim()) throw Error('The translation service returned no text. Try again.');
        reply({ok:true,text});
      } catch (error) { reply({ok:false,error:error.name === 'TimeoutError' ? 'Translation timed out. Check your connection and try again.' : error.message}); }
    })();
    return true;
  }
});
chrome.tabs.onRemoved.addListener(id => chrome.storage.session.remove('target:' + id));
