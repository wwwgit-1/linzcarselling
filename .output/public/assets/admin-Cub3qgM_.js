import{a as e}from"./rolldown-runtime-CNC7AqOf.js";import{n as t,t as n}from"./jsx-runtime-CaR_m4Xc.js";import{t as r}from"./proxy-BPUov0s-.js";import{i}from"./index-BeeHo6Qc.js";import{n as a,t as o}from"./api-D0_P4wlt.js";var s=e(t()),c=n(),l=`linz-current-user`,u=1e3,d=.72;function f(e,t){return new Promise(n=>{e.toBlob(e=>{if(!e){n(t);return}let r=t.name.replace(/\.[^.]+$/,``)||`vehicle-image`;n(new File([e],`${r}.jpg`,{type:`image/jpeg`}))},`image/jpeg`,d)})}async function p(e){if(!e.type.startsWith(`image/`))return e;try{let t=await createImageBitmap(e),n=Math.min(1,u/Math.max(t.width,t.height)),r=Math.max(1,Math.round(t.width*n)),i=Math.max(1,Math.round(t.height*n)),a=document.createElement(`canvas`);a.width=r,a.height=i;let o=a.getContext(`2d`);return o?(o.drawImage(t,0,0,r,i),t.close(),f(a,e)):(t.close(),e)}catch{return e}}function m(e){return e instanceof DOMException&&(e.name===`QuotaExceededError`||e.name===`NS_ERROR_DOM_QUOTA_REACHED`||e.code===22||e.code===1014)}function h(){let[e,t]=(0,s.useState)(!1),[n,u]=(0,s.useState)({}),[d,f]=(0,s.useState)([]),[h,_]=(0,s.useState)(0),[v,y]=(0,s.useState)(0),[b,x]=(0,s.useState)([]),[S,C]=(0,s.useState)([]),[w,T]=(0,s.useState)(null),[E,D]=(0,s.useState)(``),[O,k]=(0,s.useState)(!1),[A,j]=(0,s.useState)({vpnActive:null,vpnLocation:`Not checked`,actualLocation:`Not checked`,note:`Run the location check to compare IP-based location with browser geolocation.`});(0,s.useEffect)(()=>{if(JSON.parse(localStorage.getItem(l)??`null`)?.role!==`admin`){window.location.href=`/`;return}t(!0),M();let e=setInterval(()=>{Promise.all([o(`/api/visitor-count`).then(e=>_(e.currentActiveVisitors)),o(`/api/download-count`).then(e=>y(e.totalDownloads))]).catch(console.error)},1e4);return()=>clearInterval(e)},[]);let M=async()=>{u(await o(`/api/users`));try{f(await o(`/api/vehicles`))}catch(e){console.error(e),D(`Could not load vehicles from the database.`)}try{let e=await o(`/api/visitor-count`);_(e.currentActiveVisitors)}catch(e){console.error(e)}try{let e=await o(`/api/download-count`);y(e.totalDownloads)}catch(e){console.error(e)}},N=e=>{u(e),a(`/api/users`,`PUT`,e).catch(e=>{console.error(e),D(`Could not save user changes to the database.`)})},P=(e,t)=>{let r={...n},i=r[e];if(!i)return;delete r[e];let a={...i,...t};r[a.email.toLowerCase()]=a,N(r)},F=async e=>{if(e.preventDefault(),b.length===0&&S.length===0){D(`Add at least one vehicle image before saving.`);return}D(``),k(!0);try{let t=new FormData(e.currentTarget);t.delete(`cardImages`),t.delete(`galleryImages`),t.delete(`detailsPackage`);for(let e of b){let n=await p(e.file);t.append(`cardImages`,n,n.name)}for(let e of S){let n=await p(e.file);t.append(`galleryImages`,n,n.name)}w&&t.append(`detailsPackage`,w,w.name);let n=await fetch(`/api/vehicles`,{method:`POST`,body:t});if(!n.ok){let e=await n.json().catch(()=>null);throw Error(e?.error??`Vehicle upload failed with ${n.status}`)}let r=[await n.json(),...d];f(r),e.currentTarget.reset(),B(),T(null),D(``)}catch(e){console.error(e),D(m(e)?`The vehicle was not saved because browser storage is full. Try fewer images, smaller images, or remove an old vehicle first.`:e instanceof Error?e.message:`The vehicle was not saved because the selected files could not be processed. Try different image files.`)}finally{k(!1)}},I=e=>{if(!e)return;let t=Array.from(e).map(e=>({file:e,previewUrl:URL.createObjectURL(e)}));x(e=>[...e,...t]),D(``)},L=e=>{if(!e?.length)return;let t=e[0];C(e=>(e.forEach(e=>URL.revokeObjectURL(e.previewUrl)),[{file:t,previewUrl:URL.createObjectURL(t)}])),D(``)},R=e=>{x(t=>{let n=t[e];return n&&URL.revokeObjectURL(n.previewUrl),t.filter((t,n)=>n!==e)})},z=e=>{C(t=>{let n=t[e];return n&&URL.revokeObjectURL(n.previewUrl),t.filter((t,n)=>n!==e)})},B=()=>{b.forEach(e=>URL.revokeObjectURL(e.previewUrl)),S.forEach(e=>URL.revokeObjectURL(e.previewUrl)),x([]),C([])},V=async e=>{try{let t=await a(`/api/vehicles/${e}`,`DELETE`);if(t.ok){let t=d.filter(t=>t.id!==e);f(t),D(``)}else D(t.error||`Could not remove the vehicle from the database.`)}catch(e){console.error(`Delete error:`,e);let t=e instanceof Error?e.message:`Could not remove the vehicle from the database.`;D(t)}},H=async()=>{j(e=>({...e,note:`Checking IP and browser geolocation...`}));let e=`Unavailable`,t=null;try{let n=await(await fetch(`https://ipwho.is/?security=1`)).json();e=[n.city,n.region,n.country].filter(Boolean).join(`, `)||`Unknown IP location`,t=!!(n.security?.vpn||n.security?.proxy||n.security?.tor)}catch{e=`IP lookup failed`}if(!navigator.geolocation){j({vpnActive:t,vpnLocation:e,actualLocation:`Browser geolocation unavailable`,note:`VPN detection uses IP intelligence; actual location requires browser geolocation permission.`});return}navigator.geolocation.getCurrentPosition(n=>{let r={vpnActive:t,vpnLocation:e,actualLocation:`${n.coords.latitude.toFixed(4)}, ${n.coords.longitude.toFixed(4)}`,note:`Actual location is browser GPS/network geolocation. IP location can reflect VPN exit location.`};j(r),U(r)},()=>{let n={vpnActive:t,vpnLocation:e,actualLocation:`Permission denied or unavailable`,note:`Actual location requires user permission. VPN status is inferred from IP intelligence.`};j(n),U(n)},{enableHighAccuracy:!1,timeout:1e4})},U=e=>{let t=JSON.parse(localStorage.getItem(l)??`null`);if(!t)return;let r={...n},i=r[t.email.toLowerCase()];i&&(r[t.email.toLowerCase()]={...i,vpnActive:e.vpnActive,vpnLocation:e.vpnLocation,actualLocation:e.actualLocation,lastSeen:new Date().toISOString()},N(r))};return e?typeof window<`u`&&window.location.pathname.startsWith(`/admin/users/`)?(0,c.jsx)(i,{}):(0,c.jsxs)(`main`,{className:`admin-page min-h-screen bg-[#f5f7fb] px-4 py-8 text-[#172033] sm:px-6 lg:px-8`,children:[(0,c.jsxs)(`div`,{className:`mx-auto w-full max-w-[1760px]`,children:[(0,c.jsxs)(`div`,{className:`admin-shell-header flex flex-wrap items-center justify-between gap-4`,children:[(0,c.jsxs)(`div`,{children:[(0,c.jsx)(`div`,{className:`text-xs font-bold uppercase tracking-[0.3em] text-[#b87913]`,children:`Administrator`}),(0,c.jsxs)(`div`,{className:`mt-2 flex items-center gap-3`,children:[(0,c.jsx)(`h1`,{className:`font-display text-4xl font-bold`,children:`Linz Control Room`}),(0,c.jsxs)(`div`,{className:`rounded-full bg-[#e8a838] px-4 py-1 text-sm font-bold text-[#0a1628]`,children:[h,` Visitors`]}),(0,c.jsxs)(`div`,{className:`rounded-full bg-[#172033] px-4 py-1 text-sm font-bold text-white`,children:[v,` Downloads`]})]})]}),(0,c.jsx)(`a`,{href:`/`,className:`rounded-full bg-[#172033] px-5 py-2 font-bold text-white shadow-sm`,children:`Back to site`})]}),(0,c.jsx)(`section`,{className:`mt-8`,children:(0,c.jsxs)(g,{title:`Users, Location, and Account Management`,children:[(0,c.jsx)(`button`,{onClick:H,className:`rounded-full bg-[#e8a838] px-5 py-2 font-bold text-[#0a1628]`,children:`Record Current Visitor VPN/Location`}),(0,c.jsx)(`p`,{className:`mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/65`,children:A.note}),(0,c.jsx)(`div`,{className:`mt-5 overflow-x-auto`,children:(0,c.jsxs)(`table`,{className:`w-full min-w-[1180px] border-separate border-spacing-y-2 text-left text-sm`,children:[(0,c.jsx)(`thead`,{className:`text-xs uppercase tracking-wider text-white/45`,children:(0,c.jsxs)(`tr`,{children:[(0,c.jsx)(`th`,{className:`px-3 py-2`,children:`User`}),(0,c.jsx)(`th`,{className:`px-3 py-2`,children:`Email`}),(0,c.jsx)(`th`,{className:`px-3 py-2`,children:`Password`}),(0,c.jsx)(`th`,{className:`px-3 py-2`,children:`Country`}),(0,c.jsx)(`th`,{className:`px-3 py-2`,children:`Residence`}),(0,c.jsx)(`th`,{className:`px-3 py-2`,children:`VPN`}),(0,c.jsx)(`th`,{className:`px-3 py-2`,children:`VPN Location`}),(0,c.jsx)(`th`,{className:`px-3 py-2`,children:`Actual Location`}),(0,c.jsx)(`th`,{className:`px-3 py-2`,children:`Download Status`}),(0,c.jsx)(`th`,{className:`px-3 py-2`,children:`Activity`})]})}),(0,c.jsx)(`tbody`,{children:Object.values(n).map(e=>(0,c.jsxs)(`tr`,{className:`bg-white/[0.055] align-top`,children:[(0,c.jsxs)(`td`,{className:`rounded-l-xl px-3 py-3`,children:[(0,c.jsx)(`div`,{className:`font-semibold`,children:e.username}),(0,c.jsx)(`div`,{className:`text-xs uppercase tracking-wider text-white/40`,children:e.role??`user`})]}),(0,c.jsx)(`td`,{className:`px-3 py-3`,children:(0,c.jsx)(`input`,{value:e.email,onChange:t=>P(e.email,{email:t.target.value}),className:`admin-field min-w-56`})}),(0,c.jsx)(`td`,{className:`px-3 py-3`,children:(0,c.jsx)(`input`,{value:e.password,onChange:t=>P(e.email,{password:t.target.value}),className:`admin-field min-w-40`})}),(0,c.jsx)(`td`,{className:`px-3 py-3`,children:(0,c.jsx)(`input`,{value:e.country??``,onChange:t=>P(e.email,{country:t.target.value}),className:`admin-field min-w-36`})}),(0,c.jsx)(`td`,{className:`px-3 py-3`,children:(0,c.jsx)(`input`,{value:e.location??``,onChange:t=>P(e.email,{location:t.target.value}),className:`admin-field min-w-40`})}),(0,c.jsx)(`td`,{className:`px-3 py-3`,children:e.vpnActive==null?`Unknown`:e.vpnActive?`Active`:`No`}),(0,c.jsx)(`td`,{className:`px-3 py-3 text-white/65`,children:e.vpnLocation??`Not recorded`}),(0,c.jsx)(`td`,{className:`px-3 py-3 text-white/65`,children:e.actualLocation??`Not recorded`}),(0,c.jsx)(`td`,{className:`px-3 py-3`,children:e.downloads&&e.downloads.length>0?(0,c.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,c.jsx)(`span`,{className:`inline-block h-2.5 w-2.5 rounded-full bg-green-500`}),(0,c.jsxs)(`span`,{className:`text-xs text-green-400`,children:[e.downloads.length,` downloaded`]})]}):(0,c.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,c.jsx)(`span`,{className:`inline-block h-2.5 w-2.5 rounded-full bg-red-500`}),(0,c.jsx)(`span`,{className:`text-xs text-red-400`,children:`None`})]})}),(0,c.jsx)(`td`,{className:`rounded-r-xl px-3 py-3`,children:(0,c.jsx)(`a`,{href:`/admin/users/${encodeURIComponent(e.email)}`,className:`rounded-full border border-[#e8a838]/50 px-3 py-1.5 text-[#e8a838] hover:bg-[#e8a838] hover:text-[#0a1628]`,children:`VIEW`})})]},e.email))})]})})]})}),(0,c.jsxs)(`section`,{className:`mt-5 grid gap-5`,children:[(0,c.jsx)(g,{title:`Add Vehicle`,children:(0,c.jsxs)(`form`,{onSubmit:F,encType:`multipart/form-data`,className:`grid gap-4 grid-cols-1`,children:[(0,c.jsx)(`input`,{name:`vehicle`,placeholder:`Vehicle`,className:`admin-field`}),(0,c.jsx)(`input`,{name:`price`,type:`number`,placeholder:`Price`,className:`admin-field`}),(0,c.jsx)(`input`,{name:`weeklyRepayment`,type:`number`,placeholder:`Weekly Repayment`,className:`admin-field`}),(0,c.jsx)(`input`,{name:`make`,placeholder:`Make`,className:`admin-field`}),(0,c.jsx)(`input`,{name:`model`,placeholder:`Model`,className:`admin-field`}),(0,c.jsx)(`input`,{name:`bodyType`,placeholder:`Body Type`,className:`admin-field`}),(0,c.jsx)(`input`,{name:`year`,placeholder:`Year`,className:`admin-field`}),(0,c.jsx)(`input`,{name:`condition`,placeholder:`Condition`,className:`admin-field`}),(0,c.jsx)(`input`,{name:`fuelType`,placeholder:`Fuel Type`,className:`admin-field`}),(0,c.jsx)(`input`,{name:`cylinders`,placeholder:`Cylinders`,className:`admin-field`}),(0,c.jsx)(`input`,{name:`driveType`,placeholder:`Drive Type`,className:`admin-field`}),(0,c.jsx)(`input`,{name:`engineType`,placeholder:`Engine Type`,className:`admin-field`}),(0,c.jsx)(`input`,{name:`capacityCc`,placeholder:`Capacity/CC`,className:`admin-field`}),(0,c.jsx)(`input`,{name:`power`,placeholder:`Power`,className:`admin-field`}),(0,c.jsx)(`input`,{name:`torque`,placeholder:`Torque`,className:`admin-field`}),(0,c.jsx)(`input`,{name:`releaseDate`,type:`date`,placeholder:`Release Date`,className:`admin-field`}),(0,c.jsx)(`input`,{name:`buildDate`,type:`date`,placeholder:`Build Date`,className:`admin-field`}),(0,c.jsx)(`input`,{name:`complianceDate`,type:`date`,placeholder:`Compliance Date`,className:`admin-field`}),(0,c.jsx)(`input`,{name:`modelYear`,placeholder:`Model Year`,className:`admin-field`}),(0,c.jsx)(`input`,{name:`mileage`,type:`number`,placeholder:`Mileage`,className:`admin-field`}),(0,c.jsx)(`input`,{name:`color`,placeholder:`Color`,className:`admin-field`}),(0,c.jsxs)(r.div,{initial:{opacity:0,scale:.95},animate:{opacity:1,scale:1},transition:{duration:.4},children:[(0,c.jsx)(`label`,{className:`block mb-2 text-xs font-semibold uppercase tracking-wider text-[#667085]`,children:`Card Display Images`}),(0,c.jsxs)(r.div,{whileHover:{scale:1.01,borderColor:`rgba(232,168,56,0.6)`},className:`relative border-2 border-dashed border-[#d7dee9] rounded-3xl bg-gradient-to-br from-[#f8fafc] to-[#f0f4f8] p-8 transition-all shadow-sm`,onDragOver:e=>{e.preventDefault(),e.currentTarget.classList.add(`border-[#e8a838]`,`bg-[#fff9ed]`)},onDragLeave:e=>{e.preventDefault(),e.currentTarget.classList.remove(`border-[#e8a838]`,`bg-[#fff9ed]`)},onDrop:e=>{e.preventDefault(),e.currentTarget.classList.remove(`border-[#e8a838]`,`bg-[#fff9ed]`);let t=e.dataTransfer.files;t.length>0&&I(t)},children:[(0,c.jsx)(`input`,{name:`cardImages`,type:`file`,accept:`image/*`,multiple:!0,className:`absolute inset-0 w-full h-full opacity-0 cursor-pointer`,onChange:e=>{I(e.currentTarget.files),e.currentTarget.value=``}}),(0,c.jsxs)(`div`,{className:`text-center`,children:[(0,c.jsx)(r.div,{animate:{y:[0,-5,0]},transition:{duration:2,repeat:1/0,ease:`easeInOut`},className:`mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-amber/20 to-amber/10 flex items-center justify-center mb-4 shadow-lg shadow-amber/20`,children:(0,c.jsx)(`i`,{className:`fa-solid fa-cloud-arrow-up text-[#e8a838] text-2xl`})}),(0,c.jsx)(`p`,{className:`text-sm font-semibold text-[#172033]`,children:b.length>0?`${b.length} image${b.length>1?`s`:``} selected`:`Drop images here or click to upload`}),(0,c.jsx)(`p`,{className:`text-xs text-[#8a95a8] mt-2`,children:`PNG, JPG up to 8MB each`})]})]}),b.length>0&&(0,c.jsx)(r.div,{initial:{opacity:0,y:10},animate:{opacity:1,y:0},className:`mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6`,children:b.map((e,t)=>(0,c.jsxs)(r.div,{initial:{opacity:0,scale:.8},animate:{opacity:1,scale:1},transition:{delay:t*.05},whileHover:{scale:1.05,rotate:2},className:`group relative aspect-square rounded-2xl overflow-hidden border-2 border-[#e8a838]/30 shadow-lg`,children:[(0,c.jsx)(`img`,{src:e.previewUrl,alt:e.file.name,className:`h-full w-full object-cover`}),(0,c.jsx)(`div`,{className:`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}),(0,c.jsx)(r.button,{whileHover:{scale:1.1},whileTap:{scale:.9},type:`button`,onClick:()=>R(t),className:`absolute top-2 right-2 h-10 w-10 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 shadow-xl`,children:(0,c.jsx)(`i`,{className:`fa-solid fa-xmark`})}),(0,c.jsx)(`div`,{className:`absolute bottom-0 left-0 right-0 p-2 text-white text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity`,children:e.file.name})]},`${e.file.name}-${t}`))})]}),(0,c.jsxs)(r.div,{initial:{opacity:0,scale:.95},animate:{opacity:1,scale:1},transition:{duration:.4,delay:.1},children:[(0,c.jsx)(`label`,{className:`block mb-2 text-xs font-semibold uppercase tracking-wider text-[#667085]`,children:`Details ZIP Package`}),(0,c.jsxs)(r.div,{whileHover:{scale:1.01,borderColor:`rgba(232,168,56,0.6)`},className:`relative border-2 border-dashed border-[#d7dee9] rounded-3xl bg-gradient-to-br from-[#f8fafc] to-[#f0f4f8] p-8 transition-all shadow-sm`,children:[(0,c.jsx)(`input`,{name:`detailsPackage`,type:`file`,accept:`.zip,application/zip,application/x-zip-compressed`,className:`absolute inset-0 w-full h-full opacity-0 cursor-pointer`,onChange:e=>{T(e.currentTarget.files?.[0]??null),e.currentTarget.value=``}}),(0,c.jsxs)(`div`,{className:`text-center`,children:[(0,c.jsx)(r.div,{animate:{rotate:[0,5,-5,0]},transition:{duration:3,repeat:1/0,ease:`easeInOut`},className:`mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-amber/20 to-amber/10 flex items-center justify-center mb-4 shadow-lg shadow-amber/20`,children:(0,c.jsx)(`i`,{className:`fa-solid fa-file-zipper text-[#e8a838] text-2xl`})}),(0,c.jsx)(`p`,{className:`text-sm font-semibold text-[#172033]`,children:w?w.name:`Drop ZIP file here or click to upload`}),(0,c.jsx)(`p`,{className:`text-xs text-[#8a95a8] mt-2`,children:`ZIP files only, up to 8MB`})]})]}),w&&(0,c.jsxs)(r.div,{initial:{opacity:0,scale:.9},animate:{opacity:1,scale:1},className:`mt-3 flex items-center gap-3 p-4 bg-gradient-to-r from-amber/10 to-amber/5 rounded-2xl border border-amber/30 shadow-lg`,children:[(0,c.jsx)(`div`,{className:`h-10 w-10 rounded-full bg-amber/20 flex items-center justify-center`,children:(0,c.jsx)(`i`,{className:`fa-solid fa-file-zipper text-amber`})}),(0,c.jsx)(`span`,{className:`text-sm font-semibold text-[#172033] flex-1 truncate`,children:w.name}),(0,c.jsx)(r.button,{whileHover:{scale:1.1},whileTap:{scale:.9},type:`button`,onClick:()=>T(null),className:`h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-lg`,children:(0,c.jsx)(`i`,{className:`fa-solid fa-xmark`})})]})]}),(0,c.jsxs)(r.div,{initial:{opacity:0,scale:.95},animate:{opacity:1,scale:1},transition:{duration:.4,delay:.2},children:[(0,c.jsx)(`label`,{className:`block mb-2 text-xs font-semibold uppercase tracking-wider text-[#667085]`,children:`Detailed View Image`}),(0,c.jsxs)(r.div,{whileHover:{scale:1.01,borderColor:`rgba(232,168,56,0.6)`},className:`relative border-2 border-dashed border-[#d7dee9] rounded-3xl bg-gradient-to-br from-[#f8fafc] to-[#f0f4f8] p-8 transition-all shadow-sm`,children:[(0,c.jsx)(`input`,{name:`galleryImages`,type:`file`,accept:`image/*`,className:`absolute inset-0 w-full h-full opacity-0 cursor-pointer`,onChange:e=>{L(e.currentTarget.files),e.currentTarget.value=``}}),(0,c.jsxs)(`div`,{className:`text-center`,children:[(0,c.jsx)(r.div,{animate:{scale:[1,1.1,1]},transition:{duration:2,repeat:1/0,ease:`easeInOut`},className:`mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-amber/20 to-amber/10 flex items-center justify-center mb-4 shadow-lg shadow-amber/20`,children:(0,c.jsx)(`i`,{className:`fa-solid fa-image text-[#e8a838] text-2xl`})}),(0,c.jsx)(`p`,{className:`text-sm font-semibold text-[#172033]`,children:S.length>0?`${S.length} image${S.length>1?`s`:``} selected`:`Drop image here or click to upload`}),(0,c.jsx)(`p`,{className:`text-xs text-[#8a95a8] mt-2`,children:`PNG, JPG up to 8MB`})]})]}),S.length>0&&(0,c.jsx)(r.div,{initial:{opacity:0,y:10},animate:{opacity:1,y:0},className:`mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6`,children:S.map((e,t)=>(0,c.jsxs)(r.div,{initial:{opacity:0,scale:.8},animate:{opacity:1,scale:1},transition:{delay:t*.05},whileHover:{scale:1.05,rotate:-2},className:`group relative aspect-square rounded-2xl overflow-hidden border-2 border-[#e8a838]/30 shadow-lg`,children:[(0,c.jsx)(`img`,{src:e.previewUrl,alt:e.file.name,className:`h-full w-full object-cover`}),(0,c.jsx)(`div`,{className:`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}),(0,c.jsx)(r.button,{whileHover:{scale:1.1},whileTap:{scale:.9},type:`button`,onClick:()=>z(t),className:`absolute top-2 right-2 h-10 w-10 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 shadow-xl`,children:(0,c.jsx)(`i`,{className:`fa-solid fa-xmark`})}),(0,c.jsx)(`div`,{className:`absolute bottom-0 left-0 right-0 p-2 text-white text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity`,children:e.file.name})]},`${e.file.name}-${t}`))})]}),E&&(0,c.jsx)(`div`,{className:`admin-upload-error`,children:E}),(0,c.jsx)(`textarea`,{name:`specs`,required:!0,rows:4,placeholder:`Detailed specifications for AI training: engine, drivetrain, seats, fuel type, range, features, ideal buyer...`,className:`admin-field resize-none`}),(0,c.jsxs)(`select`,{name:`tag`,className:`admin-field`,children:[(0,c.jsx)(`option`,{children:`PREMIUM`}),(0,c.jsx)(`option`,{children:`NEW`})]}),(0,c.jsx)(`button`,{type:`submit`,disabled:O,className:`rounded-full bg-[#e8a838] py-3 font-bold text-[#0a1628] disabled:cursor-wait disabled:opacity-65`,children:O?`Uploading...`:`Add to Handpicked Machines`})]})}),(0,c.jsx)(g,{title:`Current Vehicles`,children:(0,c.jsx)(`div`,{className:`overflow-x-auto`,children:(0,c.jsxs)(`table`,{className:`w-full min-w-[900px] border-separate border-spacing-y-2 text-left text-sm`,children:[(0,c.jsx)(`thead`,{className:`text-xs uppercase tracking-wider text-white/45`,children:(0,c.jsxs)(`tr`,{children:[(0,c.jsx)(`th`,{className:`px-3 py-2`,children:`Vehicle`}),(0,c.jsx)(`th`,{className:`px-3 py-2`,children:`Key Specs`}),(0,c.jsx)(`th`,{className:`px-3 py-2`,children:`Price`}),(0,c.jsx)(`th`,{className:`px-3 py-2`,children:`Mileage`}),(0,c.jsx)(`th`,{className:`px-3 py-2`,children:`Year`}),(0,c.jsx)(`th`,{className:`px-3 py-2`,children:`Images`}),(0,c.jsx)(`th`,{className:`px-3 py-2`,children:`Status`}),(0,c.jsx)(`th`,{className:`px-3 py-2`,children:`Action`})]})}),(0,c.jsx)(`tbody`,{children:d.map(e=>(0,c.jsxs)(`tr`,{className:`bg-white/[0.055] align-top`,children:[(0,c.jsx)(`td`,{className:`rounded-l-xl px-3 py-3`,children:(0,c.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,c.jsx)(`img`,{src:e.image,alt:``,className:`h-14 w-20 rounded-lg object-cover`}),(0,c.jsxs)(`div`,{children:[(0,c.jsx)(`div`,{className:`font-semibold`,children:e.vehicle||e.name}),(0,c.jsxs)(`div`,{className:`text-xs text-white/45`,children:[e.color,` · `,e.tag]})]})]})}),(0,c.jsx)(`td`,{className:`px-3 py-3`,children:(0,c.jsxs)(`div`,{className:`text-xs space-y-1`,children:[(0,c.jsxs)(`div`,{children:[(0,c.jsx)(`span`,{className:`text-white/45`,children:`Make:`}),` `,e.make||`-`]}),(0,c.jsxs)(`div`,{children:[(0,c.jsx)(`span`,{className:`text-white/45`,children:`Model:`}),` `,e.model]}),(0,c.jsxs)(`div`,{children:[(0,c.jsx)(`span`,{className:`text-white/45`,children:`Body:`}),` `,e.bodyType||`-`]}),(0,c.jsxs)(`div`,{children:[(0,c.jsx)(`span`,{className:`text-white/45`,children:`Fuel:`}),` `,e.fuelType||`-`]})]})}),(0,c.jsxs)(`td`,{className:`px-3 py-3`,children:[(0,c.jsxs)(`div`,{className:`font-semibold`,children:[`€ `,e.price.toLocaleString()]}),e.weeklyRepayment&&(0,c.jsxs)(`div`,{className:`text-xs text-white/60`,children:[`€ `,e.weeklyRepayment.toLocaleString(),`/wk`]})]}),(0,c.jsxs)(`td`,{className:`px-3 py-3`,children:[e.mileage.toLocaleString(),` km`]}),(0,c.jsx)(`td`,{className:`px-3 py-3`,children:e.year||e.modelYear||`-`}),(0,c.jsx)(`td`,{className:`px-3 py-3 text-white/60`,children:(0,c.jsxs)(`div`,{className:`text-xs`,children:[(0,c.jsxs)(`div`,{children:[`Card: `,e.images?.length??+!!e.image]}),(0,c.jsxs)(`div`,{children:[`Gallery: `,e.galleryImages?.length??0]}),e.detailsPackage&&(0,c.jsx)(`div`,{className:`text-[#e8a838]`,children:`ZIP: ✓`})]})}),(0,c.jsx)(`td`,{className:`px-3 py-3`,children:(0,c.jsx)(`span`,{className:`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${e.tag===`PREMIUM`?`bg-[#e8a838] text-[#0a1628]`:`bg-white/10 text-white`}`,children:e.tag})}),(0,c.jsx)(`td`,{className:`rounded-r-xl px-3 py-3`,children:(0,c.jsx)(`button`,{onClick:()=>V(e.id),className:`rounded-full border border-red-400/30 px-4 py-1.5 text-sm text-red-100 hover:bg-red-500/15 transition-colors`,children:`Remove`})})]},e.id))})]})})})]})]}),(0,c.jsx)(i,{}),(0,c.jsx)(`style`,{children:`
        .admin-page {
          color: #172033;
        }
        .admin-shell-header {
          border: 1px solid #e3e8f0;
          border-radius: 18px;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          box-shadow: 0 18px 50px rgba(23, 32, 51, 0.08);
          padding: 1.35rem;
        }
        .admin-page .admin-panel {
          border: 1px solid #e3e8f0;
          background: #ffffff;
          color: #172033;
          box-shadow: 0 12px 35px rgba(23, 32, 51, 0.07);
        }
        .admin-page .admin-panel h2 {
          color: #172033;
        }
        .admin-page table {
          border-spacing: 0 0.55rem;
        }
        .admin-page thead {
          color: #667085;
        }
        .admin-page tbody tr {
          background: #f8fafc !important;
          box-shadow: inset 0 0 0 1px #e8edf5;
        }
        .admin-page tbody td {
          color: #263247;
        }
        .admin-page tbody td .text-white\\/45,
        .admin-page tbody td .text-white\\/60,
        .admin-page tbody td .text-white\\/65,
        .admin-page tbody td .text-white\\/80,
        .admin-page tbody div[class*="text-white/"] {
          color: #667085 !important;
        }
        .admin-page tbody .font-semibold,
        .admin-page tbody .font-bold {
          color: #172033;
        }
        .admin-page a.rounded-full,
        .admin-page button.rounded-full {
          transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
        }
        .admin-page a.rounded-full:hover,
        .admin-page button.rounded-full:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(23, 32, 51, 0.12);
        }
        .admin-field {
          width: 100%;
          border: 1px solid #d7dee9;
          border-radius: 10px;
          background: #ffffff;
          color: #172033;
          padding: 0.75rem 0.9rem;
          outline: none;
        }
        .admin-field::placeholder {
          color: #8a95a8;
        }
        .admin-field:focus {
          border-color: #e8a838;
          box-shadow: 0 0 0 4px rgba(232,168,56,0.14);
        }
        .admin-file-field {
          width: 100%;
          border: 1px dashed #c8d2e1;
          border-radius: 12px;
          background: #f8fafc;
          color: #172033;
          display: flex;
          min-height: 138px;
          flex-direction: column;
          justify-content: space-between;
          padding: 0.9rem;
        }
        .admin-file-field span {
          display: block;
          margin-bottom: 0.65rem;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #667085;
        }
        .admin-file-control {
          display: grid;
          min-height: 46px;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          border-radius: 10px;
          border: 1px solid #d7dee9;
          background: #ffffff;
          padding: 0.55rem;
          color: #344054;
        }
        .admin-file-button {
          display: inline-flex;
          min-height: 34px;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 8px;
          background: #172033;
          color: #ffffff;
          padding: 0.45rem 0.8rem;
          font-size: 0.86rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }
        .admin-file-summary {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 0.88rem;
          color: #667085;
        }
        .admin-file-native {
          position: absolute;
          height: 1px;
          width: 1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
        }
        .admin-file-list {
          margin-top: 0.75rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          align-content: flex-start;
          min-height: 30px;
        }
        .admin-file-pill {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          border-radius: 999px;
          border: 1px solid rgba(232,168,56,0.28);
          background: rgba(232,168,56,0.12);
          padding: 0.35rem 0.65rem;
          font-size: 0.78rem;
          color: #7a4f08;
        }
        .admin-file-empty {
          margin-top: 0.75rem;
          display: flex;
          min-height: 30px;
          align-items: center;
          font-size: 0.78rem;
          color: #8a95a8;
        }
        .admin-upload-error {
          border-radius: 12px;
          border: 1px solid #fecaca;
          background: #fef2f2;
          padding: 0.75rem 0.9rem;
          color: #991b1b;
          font-size: 0.9rem;
          font-weight: 600;
        }
      `})]}):null}function g({title:e,className:t=``,children:n}){return(0,c.jsxs)(r.section,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{duration:.5,ease:`easeOut`},className:`admin-panel rounded-3xl p-6 ${t}`,children:[(0,c.jsxs)(r.h2,{initial:{opacity:0,x:-10},animate:{opacity:1,x:0},transition:{duration:.4,delay:.1},className:`mb-5 font-display text-2xl font-bold flex items-center gap-3`,children:[(0,c.jsx)(`div`,{className:`h-10 w-10 rounded-full bg-gradient-to-br from-amber to-amber/60 flex items-center justify-center shadow-lg shadow-amber/20`,children:(0,c.jsx)(`i`,{className:`fa-solid fa-gear text-white`})}),e]}),n]})}export{h as component};