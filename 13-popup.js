const $ = id => document.getElementById(id);
let target = null, busy = false, revision = 0;
const status = (text,error=false) => { $('status').textContent=text; $('status').classList.toggle('error',error); };
function buttons() {
  const has = !!$('hindi').value.trim();
  $('insert').disabled = busy || !has || !target;
  $('copy').disabled = busy || !has;
  $('translate').disabled = busy;
}
(async () => {
  try {
    const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
    const key = 'target:' + tab.id;
    const record = (await chrome.storage.session.get(key))[key];
    const frameId = record?.frameId ?? 0;
    const answer = await chrome.tabs.sendMessage(tab.id,{type:'CAPTURE'},{frameId});
    if (!answer?.ok) throw Error(answer?.error || 'No text cursor found.');
    target = {tabId:tab.id,frameId,token:answer.token};
    $('target').textContent = 'Cursor ready · ' + answer.label;
  } catch(error) {
    $('target').textContent = 'No editable cursor found';
    status('Click a webpage text field first. On an already-open page, refresh once after installing. Chrome pages and some editors are unsupported.',true);
  }
  buttons();
})();
$('english').addEventListener('input', () => { revision++; $('hindi').value=''; buttons(); status('English changed. Translate again for a fresh preview.'); });
$('hindi').addEventListener('input',buttons);
$('translate').addEventListener('click', async () => {
  const text = $('english').value.trim();
  if (!text) { status('Write an English sentence first.',true); return; }
  busy=true; buttons(); status('Translating…');
  const version = revision;
  try {
    const result = await chrome.runtime.sendMessage({type:'TRANSLATE',text});
    if (version !== revision) { status('English changed during translation. Translate again.',true); return; }
    if (!result?.ok) throw Error(result?.error || 'Translation failed. Try again.');
    $('hindi').value=result.text;
    status('Check the meaning, edit if needed, then press Type it.');
  } catch(error) { status(error.message,true); }
  finally { busy=false; buttons(); }
});
$('insert').addEventListener('click', async () => {
  if (!target) return;
  busy=true; buttons();
  try {
    const answer=await chrome.tabs.sendMessage(target.tabId,{type:'INSERT',token:target.token,text:$('hindi').value},{frameId:target.frameId});
    if (!answer?.ok) throw Error(answer?.error || 'Insertion failed.');
    status('Inserted. Nothing was submitted.');
    target=null; $('target').textContent='Inserted · reopen to choose the next cursor';
  } catch(error) { status(error.message + ' You can also copy and paste the Hindi preview.',true); }
  finally { busy=false; buttons(); }
});
$('copy').addEventListener('click',async () => {
  try { await navigator.clipboard.writeText($('hindi').value); status('Hindi copied. Paste it into your chosen field.'); }
  catch(error) { $('hindi').focus(); $('hindi').select(); status('Press Ctrl+C (Mac: Cmd+C) to copy the selected Hindi.'); }
});
