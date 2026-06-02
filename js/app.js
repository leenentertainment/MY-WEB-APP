const STORAGE_KEY = 'personalStockData_v3'

function loadData(){
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : {products:[], tx:[]}
}

function saveData(d){ localStorage.setItem(STORAGE_KEY, JSON.stringify(d)) }

function addProduct(name, sku){
  const d = loadData()
  const id = Date.now().toString()
  const price = Number(document.getElementById('product-price')?.value || 0) || 0
  d.products.push({id,name,sku,price})
  saveData(d)
  render()
}

function updateProduct(id, name, sku){
  const d = loadData()
  const p = d.products.find(x=>x.id===id)
  if(!p) return
  p.name = name; p.sku = sku
  if(document.getElementById('modal-prod-price')) p.price = Number(document.getElementById('modal-prod-price').value) || 0
  saveData(d); render()
}

function deleteProduct(id){
  const d = loadData()
  // remove product and its transactions
  d.products = d.products.filter(p=>p.id!==id)
  d.tx = d.tx.filter(t=>t.productId!==id)
  saveData(d); render()
}

function recordTx(productId, type, qty){
  const d = loadData()
  qty = Number(qty)
  if(qty <= 0) return alert('Quantity must be positive')
  if(type === 'sell'){
    const stock = computeStock().find(s=>s.product.id===productId)
    const remain = stock ? stock.in - stock.out : 0
    if(qty > remain) return alert('Not enough stock to sell (oversell prevented)')
  }
  d.tx.push({id:Date.now().toString(), productId, type, qty, date: new Date().toISOString()})
  saveData(d)
  render()
}

function updateTx(id, type, qty){
  const d = loadData()
  const t = d.tx.find(x=>x.id===id); if(!t) return
  t.type = type; t.qty = Number(qty); saveData(d); render()
}

function deleteTx(id){
  const d = loadData(); d.tx = d.tx.filter(t=>t.id!==id); saveData(d); render()
}

function computeStock(){
  const d = loadData()
  const map = {}
  d.products.forEach(p => map[p.id] = {product:p,in:0,out:0})
  d.tx.forEach(t => {
    if(!map[t.productId]) return
    if(t.type === 'buy') map[t.productId].in += t.qty
    else map[t.productId].out += t.qty
  })
  return Object.values(map)
}

function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.style.display='none')
  document.getElementById('page-'+id).style.display = ''
  document.querySelectorAll('.taskbar button').forEach(b=>b.classList.remove('active'))
  document.querySelector(`.taskbar button[data-page="${id}"]`).classList.add('active')
}

function formatDateISO(d){ return new Date(d).toLocaleString() }

function render(){
  const d = loadData()

  // nav product select
  const prodSelect = document.getElementById('tx-product')
  prodSelect.innerHTML = ''
  d.products.forEach(p => {
    const o = document.createElement('option')
    o.value = p.id; o.textContent = p.name
    prodSelect.appendChild(o)
  })

  // inventory table
  const tbody = document.querySelector('#inventory-table tbody')
  tbody.innerHTML = ''
  computeStock().forEach(s => {
    const tr = document.createElement('tr')
    const remaining = s.in - s.out
    const valuation = (remaining * (s.product.price || 0)).toFixed(2)
    tr.innerHTML = `<td>${s.product.name}</td><td>${s.product.sku||''}</td><td>${s.in}</td><td>${s.out}</td><td>${remaining}</td><td class="valued">${valuation}</td><td class="actions"><button class="small-btn" data-edit-prod="${s.product.id}">Edit</button><button class="small-btn danger" data-del-prod="${s.product.id}">Delete</button></td>`
    tbody.appendChild(tr)
  })

  // home stats
  const stats = document.getElementById('home-stats')
  const totalProducts = d.products.length
  const totalStock = computeStock().reduce((a,b)=>a+(b.in-b.out),0)
  const totalValuation = computeStock().reduce((a,b)=> a + ((b.in-b.out) * (b.product.price || 0)), 0).toFixed(2)
  stats.innerHTML = `<div class="row"><div><strong>Products:</strong> ${totalProducts}</div><div style="margin-left:20px"><strong>Total Items:</strong> ${totalStock}</div><div style="margin-left:20px"><strong>Valuation:</strong> $${totalValuation}</div></div>`

  // history
  const history = document.getElementById('history')
  history.innerHTML = ''
  d.tx.slice().reverse().forEach(t => {
    const p = d.products.find(x=>x.id===t.productId)
    const el = document.createElement('div')
    el.className = 'tx'
    el.innerHTML = `<div>${formatDateISO(t.date)} — ${p? p.name : 'Unknown'} — ${t.type} ${t.qty} <span class="muted">(${t.id})</span></div><div class="actions"><button class="small-btn" data-edit-tx="${t.id}">Edit</button><button class="small-btn danger" data-del-tx="${t.id}">Delete</button></div>`
    history.appendChild(el)
  })

  // storage key display
  const sk = document.getElementById('storage-key')
  if(sk) sk.textContent = STORAGE_KEY
}

/* Modal helpers */
function openModal(modalId){
  const bd = document.getElementById('modal-backdrop'); if(!bd) return
  // hide all modals inside
  bd.querySelectorAll('.modal').forEach(m=> m.style.display = 'none')
  const target = document.getElementById(modalId); if(!target) return
  target.style.display = 'block'
  bd.classList.add('show')
}
function closeModal(){ const bd = document.getElementById('modal-backdrop'); if(!bd) return; bd.classList.remove('show'); bd.querySelectorAll('.modal').forEach(m=> m.style.display='none') }

// Build simple inline modals in DOM
function ensureModals(){ if(document.getElementById('modal-backdrop')) return
  const bd = document.createElement('div'); bd.id='modal-backdrop'; bd.className='modal-backdrop'; bd.innerHTML = `
  <div class="modal" id="modal-product-edit"><h3>Edit Product</h3>
    <div><input id="modal-prod-name" placeholder="Name" /></div>
    <div><input id="modal-prod-sku" placeholder="SKU" /></div>
    <div><input id="modal-prod-price" type="number" step="0.01" placeholder="Unit price" /></div>
    <div class="row"><button id="modal-prod-save">Save</button><button id="modal-prod-cancel">Cancel</button></div>
  </div>
  <div class="modal" id="modal-tx-edit"><h3>Edit Transaction</h3>
    <div><select id="modal-tx-type"><option value="buy">Buy</option><option value="sell">Sell</option></select></div>
    <div><input id="modal-tx-qty" type="number" /></div>
    <div class="row"><button id="modal-tx-save">Save</button><button id="modal-tx-cancel">Cancel</button></div>
  </div>
  <div class="modal" id="modal-confirm"><h3 id="modal-confirm-title">Confirm</h3><div id="modal-confirm-body"></div><div class="row"><button id="modal-confirm-ok">OK</button><button id="modal-confirm-cancel">Cancel</button></div></div>
  `
  document.body.appendChild(bd)
  bd.addEventListener('click', e=>{ if(e.target===bd) bd.classList.remove('show') })
}

ensureModals()

let modalCallback = null
document.getElementById('modal-prod-cancel').addEventListener('click', ()=> closeModal('modal-backdrop'))
document.getElementById('modal-tx-cancel').addEventListener('click', ()=> closeModal('modal-backdrop'))
document.getElementById('modal-confirm-cancel').addEventListener('click', ()=> closeModal('modal-backdrop'))

document.getElementById('modal-prod-save').addEventListener('click', ()=>{
  if(modalCallback) modalCallback({type:'product',action:'save',data:{name:document.getElementById('modal-prod-name').value, sku:document.getElementById('modal-prod-sku').value, price: Number(document.getElementById('modal-prod-price').value)||0}})
  closeModal('modal-backdrop')
})
document.getElementById('modal-tx-save').addEventListener('click', ()=>{
  if(modalCallback) modalCallback({type:'tx',action:'save',data:{type:document.getElementById('modal-tx-type').value, qty: Number(document.getElementById('modal-tx-qty').value)||0}})
  closeModal('modal-backdrop')
})
document.getElementById('modal-confirm-ok').addEventListener('click', ()=>{ if(modalCallback) modalCallback({type:'confirm',action:'ok'}); closeModal('modal-backdrop') })

/* Firebase optional sync (simple) */
function getFirebaseConfig(){ try{ return JSON.parse(localStorage.getItem('firebaseConfig')||'null') }catch(e){return null} }
function saveFirebaseConfig(json){ try{ const obj = JSON.parse(json); localStorage.setItem('firebaseConfig', JSON.stringify(obj)); initFirebase(); document.getElementById('firebase-status').textContent='Saved'; }catch(e){ alert('Invalid JSON') } }

let firebaseApp = null, firebaseDB = null
function initFirebase(){ const cfg = getFirebaseConfig(); if(!cfg) return; try{ firebaseApp = firebase.initializeApp(cfg); firebaseDB = firebase.database(); document.getElementById('firebase-status').textContent='Connected'; }catch(e){ document.getElementById('firebase-status').textContent='Connect failed' } }

function syncNow(){ const cfg = getFirebaseConfig(); if(!cfg || !firebaseDB) return alert('Firebase not configured')
  const d = loadData()
  const ref = firebaseDB.ref('personal_stock/default')
  ref.set(d).then(()=> alert('Synced to cloud')).catch(()=> alert('Sync failed'))
}


function exportTransactionsCSV(){
  const d = loadData()
  const rows = [['id','type','productId','productName','sku','qty','date']]
  d.tx.forEach(t=>{
    const p = d.products.find(x=>x.id===t.productId) || {}
    rows.push([t.id,t.type,t.productId,p.name||'',p.sku||'',t.qty,t.date])
  })
  const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""') }"`).join(',')).join('\n')
  const blob = new Blob([csv],{type:'text/csv'})
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='transactions.csv'; a.click(); URL.revokeObjectURL(url)
}

function exportSummaryCSV(filtered){
  const rows = [['productId','productName','in','out','remaining']]
  filtered.forEach(s=> rows.push([s.product.id,s.product.name,s.in,s.out,(s.in-s.out)]))
  const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""') }"`).join(',')).join('\n')
  const blob = new Blob([csv],{type:'text/csv'})
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='summary.csv'; a.click(); URL.revokeObjectURL(url)
}

function applyFilterAndRender(){
  const from = document.getElementById('filter-from').value
  const to = document.getElementById('filter-to').value
  const d = loadData()
  const txFiltered = d.tx.filter(t=>{
    if(from){ if(new Date(t.date) < new Date(from+'T00:00:00')) return false }
    if(to){ if(new Date(t.date) > new Date(to+'T23:59:59')) return false }
    return true
  })
  const map = {}
  d.products.forEach(p=> map[p.id] = {product:p,in:0,out:0})
  txFiltered.forEach(t=>{ if(!map[t.productId]) return; if(t.type==='buy') map[t.productId].in += t.qty; else map[t.productId].out += t.qty })
  const results = Object.values(map)
  const container = document.getElementById('summary-results')
  container.innerHTML = ''
  const table = document.createElement('table')
  table.innerHTML = '<thead><tr><th>Product</th><th>In</th><th>Out</th><th>Remaining</th></tr></thead>'
  const tb = document.createElement('tbody')
  results.forEach(r=>{ const tr = document.createElement('tr'); tr.innerHTML = `<td>${r.product.name}</td><td>${r.in}</td><td>${r.out}</td><td>${r.in-r.out}</td>`; tb.appendChild(tr) })
  table.appendChild(tb)
  container.appendChild(table)
  return results
}

function backupJSON(){
  const d = loadData(); const blob = new Blob([JSON.stringify(d, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'stock-backup.json'; a.click(); URL.revokeObjectURL(url)
}

function restoreJSON(file){
  const reader = new FileReader(); reader.onload = e => {
    try{ const parsed = JSON.parse(e.target.result); if(parsed.products && parsed.tx){ saveData(parsed); render(); alert('Data restored') } else alert('Invalid backup file') }catch(err){ alert('Error parsing JSON') }
  }
  reader.readAsText(file)
}

function resetData(){ if(confirm('Reset all data? This cannot be undone')){ localStorage.removeItem(STORAGE_KEY); render() } }

document.addEventListener('DOMContentLoaded', ()=>{
  // routing
  document.querySelectorAll('.taskbar button').forEach(b=> b.addEventListener('click', e=> showPage(e.target.dataset.page)))

  // product add
  document.getElementById('add-product-form').addEventListener('submit', e=>{
    e.preventDefault(); const name = document.getElementById('product-name').value.trim(); const sku = document.getElementById('product-sku').value.trim(); if(name){ addProduct(name, sku); e.target.reset() }
  })

  // tx form
  document.getElementById('tx-form').addEventListener('submit', e=>{
    e.preventDefault(); const pid = document.getElementById('tx-product').value; const qty = document.getElementById('tx-qty').value; const type = document.getElementById('tx-type').value; if(pid && qty && qty>0) recordTx(pid,type,qty)
  })

  // export/import
  document.getElementById('export-tx').addEventListener('click', exportTransactionsCSV)
  document.getElementById('import-file').addEventListener('change', e=>{ if(e.target.files[0]) restoreJSON(e.target.files[0]); e.target.value = '' })

  // summary
  document.getElementById('apply-filter').addEventListener('click', ()=> applyFilterAndRender())
  document.getElementById('export-summary').addEventListener('click', ()=>{ const res = applyFilterAndRender(); exportSummaryCSV(res) })

  // settings
  document.getElementById('backup-data').addEventListener('click', backupJSON)
  document.getElementById('restore-file').addEventListener('change', e=>{ if(e.target.files[0]) restoreJSON(e.target.files[0]); e.target.value = '' })
  document.getElementById('reset-data').addEventListener('click', resetData)

  // delegate edit/delete actions
  document.body.addEventListener('click', e=>{
      if(e.target.matches('[data-edit-prod]')){
        const id = e.target.dataset.editProd
        const d = loadData(); const p = d.products.find(x=>x.id===id)
        if(!p) return
        // populate modal
        document.getElementById('modal-prod-name').value = p.name
        document.getElementById('modal-prod-sku').value = p.sku||''
        document.getElementById('modal-prod-price').value = p.price||''
        modalCallback = ({type,action,data})=>{ if(action==='save') updateProduct(id, data.name.trim(), data.sku.trim()); modalCallback = null }
        openModal('modal-product-edit')
      }
      if(e.target.matches('[data-del-prod]')){
        const id = e.target.dataset.delProd
        modalCallback = ({type,action})=>{ if(action==='ok') deleteProduct(id); modalCallback = null }
        document.getElementById('modal-confirm-title').textContent = 'Delete product'
        document.getElementById('modal-confirm-body').textContent = 'Delete product and its transactions?'
        openModal('modal-confirm')
      }
      if(e.target.matches('[data-edit-tx]')){
        const id = e.target.dataset.editTx
        const d = loadData(); const t = d.tx.find(x=>x.id===id)
        if(!t) return
        document.getElementById('modal-tx-type').value = t.type
        document.getElementById('modal-tx-qty').value = t.qty
        modalCallback = ({type,action,data})=>{ if(action==='save') updateTx(id, data.type, data.qty); modalCallback = null }
        openModal('modal-tx-edit')
      }
      if(e.target.matches('[data-del-tx]')){
        const id = e.target.dataset.delTx
        modalCallback = ({type,action})=>{ if(action==='ok') deleteTx(id); modalCallback = null }
        document.getElementById('modal-confirm-title').textContent = 'Delete transaction'
        document.getElementById('modal-confirm-body').textContent = 'Delete this transaction?'
        openModal('modal-confirm')
      }
    })

  // firebase UI bindings
  document.getElementById('save-firebase').addEventListener('click', ()=> saveFirebaseConfig(document.getElementById('firebase-config').value))
  document.getElementById('sync-now').addEventListener('click', ()=> syncNow())

  // initialize firebase textarea and connection if saved
  const savedCfg = getFirebaseConfig(); if(savedCfg) { document.getElementById('firebase-config').value = JSON.stringify(savedCfg); initFirebase() }

  // initial render + show home
  render(); showPage('home')
})
