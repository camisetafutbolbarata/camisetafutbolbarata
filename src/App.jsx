import React, { useEffect, useState } from 'react'
import leaguesData from './data/ligas_equipos.json'
import discountsData from './data/discounts.json'

const PAYPAL_BUSINESS = "gorka0804@gmail.com"

function formatPrice(amount, currency='EUR'){
  const locales = { EUR:'es-ES', GBP:'en-GB', USD:'en-US' }
  try{ return new Intl.NumberFormat(locales[currency]||'en-US',{style:'currency',currency}).format(amount) }catch(e){ return amount+'.00' }
}

export default function App(){
  const [leagues] = useState(leaguesData)
  const [currency, setCurrency] = useState('EUR')
  const [lang, setLang] = useState('es')
  const [cart, setCart] = useState(()=> JSON.parse(localStorage.getItem('cfb_cart')||'[]'))
  const [selectedLeague, setSelectedLeague] = useState(null)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [products, setProducts] = useState([])
  const [openProduct, setOpenProduct] = useState(null)
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState(null)
  const [checkoutInfo, setCheckoutInfo] = useState({name:'',address:'',city:'',state:'',zip:'',country:'',phone:'',social:''})
  const [canPay, setCanPay] = useState(false)

  useEffect(()=> localStorage.setItem('cfb_cart', JSON.stringify(cart)), [cart])

  useEffect(()=>{
    const all = []
    leagues.forEach(league=>{
      league.teams.forEach(team=>{
        const baseId = team.id
        const categories = ['camisetas-25-26','camisetas-retro','especiales','ropa-entrenamiento','equipaciones-ninos','sudaderas','cortavientos','chaquetas','chandals']
        categories.forEach(cat=>{
          const p = {
            id: `${baseId}-${cat}`,
            title: `${team.name} - ${cat.replace(/-/g,' ')}`,
            teamId: baseId,
            leagueId: league.id,
            category: cat,
            images: team.images||[],
            price: cat.includes('retro')?23:20
          }
          all.push(p)
        })
      })
    })
    setProducts(all)
  },[leagues])

  useEffect(()=>{
    const ok = checkoutInfo.name.trim() && checkoutInfo.address.trim() && checkoutInfo.city.trim() &&
               checkoutInfo.state.trim() && checkoutInfo.zip.trim() && checkoutInfo.country.trim() &&
               checkoutInfo.phone.trim() && checkoutInfo.social.trim()
    setCanPay(!!(ok && cart.length>0))
  },[checkoutInfo, cart])

  function addToCart(product, opts={}){ setCart(c=>[...c,{...product, opts, qty:1}]) }
  function removeFromCart(i){ setCart(c=> c.filter((_,idx)=>idx!==i)) }
  function clearCart(){ setCart([]); setAppliedDiscount(null); setDiscountCode('') }

  function applyDiscount(){
    const code = discountCode.trim().toLowerCase()
    const found = discountsData.find(d=>d.code.toLowerCase()===code)
    if(!found){ alert('Código inválido'); setAppliedDiscount(null); return }
    setAppliedDiscount(found)
    alert(`Código aplicado: ${found.code} (${found.discount}% )`)
  }

  const subtotal = cart.reduce((s,it)=> s + (it.price||0)* (it.qty||1), 0)
  const discountAmount = appliedDiscount ? subtotal * (appliedDiscount.discount/100) : 0
  const total = subtotal - discountAmount

  function submitToPayPal(){
    if(!canPay){ alert('Rellena todos los datos de envío antes de pagar.'); return }
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = 'https://www.paypal.com/cgi-bin/webscr'
    form.target = '_blank'
    form.style.display = 'none'
    const cmd = document.createElement('input'); cmd.type='hidden'; cmd.name='cmd'; cmd.value='_cart'; form.appendChild(cmd)
    const upload = document.createElement('input'); upload.type='hidden'; upload.name='upload'; upload.value='1'; form.appendChild(upload)
    const business = document.createElement('input'); business.type='hidden'; business.name='business'; business.value=PAYPAL_BUSINESS; form.appendChild(business)
    const currencyInput = document.createElement('input'); currencyInput.type='hidden'; currencyInput.name='currency_code'; currencyInput.value=currency; form.appendChild(currencyInput)
    cart.forEach((it,idx)=>{
      const i = idx+1
      const item_name = document.createElement('input'); item_name.type='hidden'; item_name.name=`item_name_${i}`; item_name.value=it.title; form.appendChild(item_name)
      const amount = document.createElement('input'); amount.type='hidden'; amount.name=`amount_${i}`; amount.value=(it.price||0).toFixed(2); form.appendChild(amount)
      const quantity = document.createElement('input'); quantity.type='hidden'; quantity.name=`quantity_${i}`; quantity.value=it.qty||1; form.appendChild(quantity)
      const custom = document.createElement('input'); custom.type='hidden'; custom.name=`custom_${i}`
      const opts = []
      if(it.opts.talla) opts.push('Talla:'+it.opts.talla)
      if(it.opts.nameCustom) opts.push('Nombre:'+it.opts.nameCustom)
      if(it.opts.numberCustom) opts.push('Numero:'+it.opts.numberCustom)
      if(it.opts.patch1) opts.push('Parche1:Yes')
      if(it.opts.patch2) opts.push('Parche2:Yes')
      custom.value = opts.join('|')
      form.appendChild(custom)
    })
    const invoice = document.createElement('input'); invoice.type='hidden'; invoice.name='invoice'; invoice.value = JSON.stringify({checkoutInfo, cart, subtotal, discountAmount, total}); form.appendChild(invoice)
    const returnUrl = document.createElement('input'); returnUrl.type='hidden'; returnUrl.name='return'; returnUrl.value=window.location.href; form.appendChild(returnUrl)
    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
    clearCart()
    alert('Redirigiendo a PayPal en una nueva pestaña...')
  }

  function openTeamView(leagueId, teamId){ setSelectedLeague(leagueId); setSelectedTeam(teamId) }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-red-500 via-yellow-400 to-indigo-500 text-white p-4 shadow">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white rounded overflow-hidden flex items-center justify-center"><img src="/logo-placeholder.png" alt="logo" /></div>
            <h1 className="text-2xl font-bold">Camisetafutbolbarata</h1>
          </div>
          <div className="flex items-center gap-3">
            <select value={lang} onChange={e=>setLang(e.target.value)} className="rounded p-1 text-black">
              <option value="es">ES</option><option value="en">EN</option><option value="it">IT</option><option value="fr">FR</option><option value="de">DE</option>
            </select>
            <select value={currency} onChange={e=>setCurrency(e.target.value)} className="rounded p-1 text-black">
              <option value="EUR">€ EUR</option><option value="GBP">£ GBP</option><option value="USD">$ USD</option>
            </select>
            <button className="bg-white text-gray-800 rounded-full px-3 py-1">Carrito ({cart.length})</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1 bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Secciones</h2>
          <nav className="flex flex-col gap-2 text-sm">
            <button className="text-left font-medium">Fútbol</button>
            <button className="text-left font-medium">Baloncesto</button>
            <button className="text-left font-medium">NFL</button>
            <button className="text-left font-medium">Motor</button>
            <button className="text-left font-medium">Equipamiento deportivo</button>
            <button className="text-left font-medium">Moda</button>
          </nav>

          <div className="mt-4">
            <h3 className="font-semibold">Ligas</h3>
            <ul className="mt-2 space-y-1 text-sm max-h-48 overflow-auto">
              {leagues.map(l=>(
                <li key={l.id} className="flex justify-between items-center">
                  <button className="text-left" onClick={()=>setSelectedLeague(l.id)}>{l.name}</button>
                  <span className="text-xs text-gray-500">{l.season}</span>
                </li>
              ))}
            </ul>
            {selectedLeague && (
              <div className="mt-3">
                <h4 className="font-semibold">Equipos</h4>
                <ul className="max-h-40 overflow-auto mt-2 space-y-1 text-sm">
                  {leagues.find(x=>x.id===selectedLeague).teams.map(team=>(
                    <li key={team.id} className="flex justify-between items-center">
                      <button onClick={()=>openTeamView(selectedLeague, team.id)}>{team.name}</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>

        <section className="md:col-span-3">
          <div className="rounded-lg overflow-hidden mb-6 shadow">
            <div className="h-48 flex items-center justify-center text-white font-bold text-3xl p-6" style={{background:'linear-gradient(90deg,#ff416c,#ff4b2b)'}}>OFERTAS - Camisetas 25/26 y Retro</div>
          </div>

          {selectedTeam ? (
            <TeamView league={leagues.find(l=>l.id===selectedLeague)} team={leagues.find(l=>l.id===selectedLeague).teams.find(t=>t.id===selectedTeam)} products={products.filter(p=>p.teamId===selectedTeam)} onOpen={p=>setOpenProduct(p)} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.slice(0,9).map(p=>(
                <div key={p.id} className="bg-white rounded shadow p-3">
                  <div className="h-40 flex items-center justify-center bg-gray-50 mb-3">{p.images.length? <img src={p.images[0]} alt={p.title} className="h-full object-contain" /> : <div className="text-gray-500">[Imagen]</div>}</div>
                  <div className="font-semibold">{p.title}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-lg font-bold">{formatPrice(p.price, currency)}</div>
                    <button className="py-1 px-3 rounded bg-yellow-400" onClick={()=>setOpenProduct(p)}>Detalles</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="bg-white p-4 rounded shadow md:col-span-1">
          <h3 className="font-semibold">Carrito</h3>
          <div className="mt-2 space-y-2">
            {cart.length===0 && <div className="text-sm text-gray-500">Carrito vacío</div>}
            {cart.map((it,i)=>(
              <div key={i} className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{it.title}</div>
                  <div className="text-xs text-gray-600">{it.opts?.talla||''}</div>
                </div>
                <div className="text-right">
                  <div>{formatPrice(it.price, currency)}</div>
                  <button className="text-xs text-red-500" onClick={()=>removeFromCart(i)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="flex gap-2">
              <input className="flex-1 border rounded p-2" placeholder="Código descuento" value={discountCode} onChange={e=>setDiscountCode(e.target.value)} />
              <button className="bg-blue-600 text-white px-3 rounded" onClick={applyDiscount}>Aplicar</button>
            </div>
            {appliedDiscount && <div className="mt-2 text-sm text-green-700">Descuento aplicado: {appliedDiscount.discount}%</div>}
            <div className="mt-3 text-sm">
              <div>Subtotal: {formatPrice(subtotal, currency)}</div>
              <div>Descuento: -{formatPrice(discountAmount, currency)}</div>
              <div className="font-bold">Total: {formatPrice(total, currency)}</div>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold">Datos de envío</h4>
            <div className="space-y-2 text-sm mt-2">
              <input value={checkoutInfo.name} onChange={e=>setCheckoutInfo({...checkoutInfo,name:e.target.value})} className="w-full border rounded p-2" placeholder="Nombre y apellidos" />
              <input value={checkoutInfo.address} onChange={e=>setCheckoutInfo({...checkoutInfo,address:e.target.value})} className="w-full border rounded p-2" placeholder="Dirección" />
              <input value={checkoutInfo.city} onChange={e=>setCheckoutInfo({...checkoutInfo,city:e.target.value})} className="w-full border rounded p-2" placeholder="Ciudad" />
              <input value={checkoutInfo.state} onChange={e=>setCheckoutInfo({...checkoutInfo,state:e.target.value})} className="w-full border rounded p-2" placeholder="Población/Estado" />
              <input value={checkoutInfo.zip} onChange={e=>setCheckoutInfo({...checkoutInfo,zip:e.target.value})} className="w-full border rounded p-2" placeholder="Código postal" />
              <input value={checkoutInfo.country} onChange={e=>setCheckoutInfo({...checkoutInfo,country:e.target.value})} className="w-full border rounded p-2" placeholder="País" />
              <input value={checkoutInfo.phone} onChange={e=>setCheckoutInfo({...checkoutInfo,phone:e.target.value})} className="w-full border rounded p-2" placeholder="Número de teléfono" />
              <input value={checkoutInfo.social} onChange={e=>setCheckoutInfo({...checkoutInfo,social:e.target.value})} className="w-full border rounded p-2" placeholder="Instagram / X / Facebook" />
            </div>

            <div className="mt-4">
              <button className={`w-full py-2 rounded ${canPay? 'bg-green-600 text-white':'bg-gray-400 text-gray-700'}`} disabled={!canPay} onClick={submitToPayPal}>Pagar con PayPal</button>
            </div>
          </div>
        </aside>

      </main>

      {openProduct && <ProductModal product={openProduct} onClose={()=>setOpenProduct(null)} onAdd={(p,opts)=>{addToCart(p,opts); setOpenProduct(null); alert('Añadido al carrito')}} />}

      <footer className="text-center text-sm text-gray-600 py-6">Camisetafutbolbarata • Hecho con ❤️</footer>
    </div>
  )
}

function TeamView({league, team, products, onOpen}){
  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">{team.name[0]}</div>
        <div>
          <h2 className="text-xl font-bold">{team.name}</h2>
          <p className="text-sm text-gray-600">Productos: {products.length}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map(p=>(
          <div key={p.id} className="bg-white rounded shadow p-3">
            <div className="h-40 flex items-center justify-center bg-gray-50 mb-3">{p.images.length? <img src={p.images[0]} alt={p.title} className="h-full object-contain" /> : <div className="text-gray-500">[Imagen]</div>}</div>
            <div className="font-semibold">{p.title}</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-lg font-bold">{formatPrice(p.price)}</div>
              <div className="flex gap-2"><button className="text-sm text-blue-600" onClick={()=>onOpen(p)}>Detalles</button></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductModal({product, onClose, onAdd}){
  const [size, setSize] = useState('M')
  const [nameCustom, setNameCustom] = useState('')
  const [numberCustom, setNumberCustom] = useState('')
  const [patch1, setPatch1] = useState(null)
  const [patch2, setPatch2] = useState(null)

  function uploadPatch(e,setFn){ const file = e.target.files[0]; if(!file) return; const url = URL.createObjectURL(file); setFn(url) }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded shadow max-w-4xl w-full p-4">
        <div className="flex gap-4">
          <div className="w-1/3">
            <div className="h-64 bg-gray-50 rounded flex items-center justify-center overflow-hidden">{product.images.length? <img src={product.images[0]} alt="main" className="object-contain h-full"/> : <div className="text-gray-500">[Galería vacía]</div>}</div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {product.images.map((im,i)=>(<img key={i} src={im} className="h-16 object-contain" alt={'t'+i}/>))}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between"><h3 className="text-xl font-bold">{product.title}</h3><button onClick={onClose} className="text-gray-500">X</button></div>
            <div className="mt-2">Precio: <span className="font-bold">{formatPrice(product.price)}</span></div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm">Talla</label>
                <select className="w-full border rounded p-2" value={size} onChange={e=>setSize(e.target.value)}><option>S</option><option>M</option><option>L</option><option>XL</option></select>
              </div>
              <div>
                <label className="block text-sm">Nombre personalizado</label>
                <input className="w-full border rounded p-2" value={nameCustom} onChange={e=>setNameCustom(e.target.value)} placeholder="RONALDO"/>
              </div>
              <div>
                <label className="block text-sm">Número personalizado</label>
                <input className="w-full border rounded p-2" value={numberCustom} onChange={e=>setNumberCustom(e.target.value)} placeholder="7"/>
              </div>
              <div>
                <label className="block text-sm">Parche 1</label>
                <input type="file" className="w-full" onChange={e=>uploadPatch(e,setPatch1)}/>
                {patch1 && <img src={patch1} className="h-12 mt-2"/>}
              </div>
              <div>
                <label className="block text-sm">Parche 2</label>
                <input type="file" className="w-full" onChange={e=>uploadPatch(e,setPatch2)}/>
                {patch2 && <img src={patch2} className="h-12 mt-2"/>}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="bg-yellow-400 px-4 py-2 rounded" onClick={()=>onAdd(product,{talla:size,nameCustom,numberCustom,patch1,patch2})}>Añadir al carrito</button>
              <button className="border px-4 py-2 rounded" onClick={onClose}>Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
