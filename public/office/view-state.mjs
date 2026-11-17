/** Retain reading/keyboard state when an existing source snapshot is repainted. */
const regions = ['office-floor','office-activity','office-evidence'];
const controls = 'a[href],button,input,select,textarea,summary,[tabindex]';
const regionFor = (document,node) => regions.find(id=>document.getElementById(id)?.contains(node));

// Keys describe the same source control, not its current age/status label.
export function bindViewKeys(document) {
  const counts = new Map();
  const unique = base => { const n=counts.get(base)||0;counts.set(base,n+1);return base+':'+n; };
  for (const id of regions) {
    const root=document.getElementById(id);if(!root)continue;
    for (const details of root.querySelectorAll('details')) {
      const handle=details.closest('[data-desk-handle]')?.dataset.deskHandle;
      details.dataset.officeDetails=unique((handle?'desk:'+handle:id)+':details');
    }
    for (const control of root.querySelectorAll(controls)) {
      const handle=control.closest('[data-desk-handle]')?.dataset.deskHandle;
      const scope=handle?'desk:'+handle:id;
      const identity=control.tagName==='SUMMARY' ? control.parentElement.dataset.officeDetails :
        control.getAttribute('href') || control.id || control.getAttribute('name') || control.getAttribute('aria-label') || control.textContent.trim();
      control.dataset.officeFocus=unique(scope+':'+control.tagName+':'+identity);
    }
  }
}

export function rememberView(document) {
  const details=[];
  for (const id of regions) for (const node of document.getElementById(id)?.querySelectorAll('details[data-office-details]')||[]) {
    details.push({key:node.dataset.officeDetails,open:node.open});
  }
  const active=document.activeElement;
  const focused=active && active!==document.body && active!==document.documentElement ?
    {node:active,key:active.dataset.officeFocus,region:regionFor(document,active)} : null;
  return {details,focused};
}

export function restoreView(document,saved) {
  const details=new Map(saved.details.map(d=>[d.key,d.open]));
  for (const id of regions) for (const node of document.getElementById(id)?.querySelectorAll('details[data-office-details]')||[]) {
    if(details.has(node.dataset.officeDetails))node.open=details.get(node.dataset.officeDetails);
  }
  const focused=saved.focused;if(!focused)return; // Never steal focus from the body on an automatic alarm.
  const usable=node=>node?.isConnected && !node.disabled;
  let target=usable(focused.node)?focused.node:null;
  if(!target && focused.key) for(const id of regions) {
    target=[...(document.getElementById(id)?.querySelectorAll('[data-office-focus]')||[])].find(node=>node.dataset.officeFocus===focused.key && usable(node));
    if(target)break;
  }
  // At cutoff a source control may legitimately disappear. Keep the reader in
  // its section, rather than dropping keyboard focus silently onto the body.
  target ||= document.getElementById(focused.region || 'office-status');
  if(target && document.activeElement!==target){
    if(!target.hasAttribute('tabindex') && !target.matches(controls))target.setAttribute('tabindex','-1');
    target.focus({preventScroll:true});
  }
}
