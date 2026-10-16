/* ===== RagaFisika - script.js (dipakai semua halaman) ===== */
const $=id=>document.getElementById(id);
const fmt=(x,d=0,g=true)=>x.toLocaleString('id-ID',{minimumFractionDigits:d,maximumFractionDigits:d,useGrouping:g});

/* 1. Ilustrasi header: jantung berdenyut, garis EKG, gelombang USG, pelari (SVG buatan sendiri) */
const scene=$('scene');
if(scene){
  scene.innerHTML=`<rect width="1000" height="260" fill="none"/>
  <g opacity=".18" fill="#fff"><circle cx="90" cy="60" r="40"/><circle cx="930" cy="200" r="55"/><circle cx="640" cy="40" r="22"/><circle cx="260" cy="215" r="30"/></g>
  <path class="heart" d="M500 215 C420 160 380 110 430 80 C465 60 495 80 500 100 C505 80 535 60 570 80 C620 110 580 160 500 215Z" fill="#ff7aa8" opacity=".9"/>
  <path class="ecg" d="M0 170 L180 170 L205 170 L220 130 L240 205 L262 80 L284 190 L300 170 L520 170 L545 170 L560 130 L580 205 L602 80 L624 190 L640 170 L1000 170" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>
  <g transform="translate(70 40)"><rect x="0" y="0" width="70" height="16" rx="5" fill="#fff" opacity=".9"/>
    <g fill="none" stroke="#fff" stroke-width="4"><path class="arc" d="M10 30 q25 14 50 0"/><path class="arc" d="M2 48 q33 20 66 0"/><path class="arc" d="M-6 68 q41 26 82 0"/></g></g>
  <g transform="translate(820 60)" stroke="#fff" stroke-width="9" stroke-linecap="round" fill="none"><circle cx="0" cy="0" r="12" fill="#fff" stroke="none"/><path d="M-4 16 L-12 62 M-4 24 L-34 44 M-4 24 L28 34 M-12 62 L-40 100 M-12 62 L20 92"/></g>`;
}

/* 2. Mode terang/gelap (disimpan di browser) */
$('mode').onclick=()=>{
  const cur=document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  const next=cur==='dark'?'light':'dark';
  document.documentElement.dataset.theme=next;
  try{localStorage.theme=next}catch(e){}
};

/* 3. Artikel: estimasi waktu baca + daftar isi otomatis */
const art=document.querySelector('article');
if(art){
  const words=[...art.querySelectorAll('p,li,h2')].filter(e=>!e.closest('.src,.sim,.key')).map(e=>e.textContent).join(' ').split(/\s+/).length;
  const rd=art.querySelector('[data-read]');if(rd)rd.textContent=Math.max(1,Math.round(words/200));
  const toc=art.querySelector('.toc');
  art.querySelectorAll('h2').forEach((h,i)=>{h.id='bagian-'+i;
    const a=document.createElement('a');a.href='#'+h.id;a.textContent=h.textContent;toc.appendChild(a)});
}

/* 4. Beranda: angka sorotan menghitung naik */
document.querySelectorAll('[data-n]').forEach(el=>{
  const target=+el.dataset.n,raw=!!el.dataset.raw;let t0=null;
  const step=ts=>{t0=t0||ts;const p=Math.min((ts-t0)/1200,1);
    el.textContent=fmt(Math.round(target*p),0,!raw);if(p<1)requestAnimationFrame(step)};
  requestAnimationFrame(step)});

/* 5. Simulator tensimeter: bunyi Korotkoff terdengar bila diastolik <= tekanan manset <= sistolik */
if($('deflate')){
  const sys=$('sys'),dia=$('dia'),p=$('p');let timer=null;
  const upd=()=>{
    if(+dia.value>+sys.value-10)dia.value=+sys.value-10; // diastolik harus lebih rendah dari sistolik
    const S=+sys.value,D=+dia.value,P=+p.value;
    $('sy').textContent=S;$('di').textContent=D;$('po').textContent=P;
    const z=$('zone');z.style.left=(D/200*100)+'%';z.style.width=((S-D)/200*100)+'%';
    $('needle').style.left=(P/200*100)+'%';
    const st=$('state');st.classList.remove('beat');
    if(P>S)st.textContent='🔴 Manset menutup arteri: darah tidak lewat, tidak ada bunyi.';
    else if(P>=D){st.textContent='🔊 Darah menyembur lewat celah sempit: aliran turbulen, bunyi "tuk" terdengar.';st.classList.add('beat')}
    else st.textContent='🟢 Arteri terbuka penuh: aliran lancar, bunyi menghilang.';
  };
  sys.oninput=dia.oninput=p.oninput=upd;
  $('deflate').onclick=()=>{
    clearInterval(timer);let rs=null,rd=null;
    $('rs').textContent=$('rd').textContent='–';
    p.value=Math.min(200,+sys.value+30);upd();
    timer=setInterval(()=>{
      const P=+p.value-2;p.value=P;upd();
      if(rs===null&&P<=+sys.value){rs=P;$('rs').textContent=P}
      if(rd===null&&P<+dia.value){rd=P;$('rd').textContent=P}
      if(P<=+dia.value-10||P<=40)clearInterval(timer)},100);
  };
  upd();
}

/* 6. Simulator USG: t = 2d/c dan panjang gelombang = c/f */
if($('ping')){
  const yOf=d=>16+(d-1)/19*92;let raf=null;
  const upd=()=>{
    const d=+$('dp').value,c=+$('md').value,f=+$('fr').value;
    $('dpo').textContent=d;$('fo').textContent=fmt(f,1);
    $('te').textContent=fmt(2*(d/100)/c*1e6,0);          // mikrodetik
    $('wl').textContent=fmt(c/(f*1e6)*1000,2);           // milimeter
    const y=yOf(d);$('dl').setAttribute('y1',y);$('dl').setAttribute('y2',y);
    $('dtxt').setAttribute('y',y+5);$('dtxt').textContent='Organ pada kedalaman '+d+' cm';
  };
  $('dp').oninput=$('md').onchange=$('fr').oninput=upd;
  $('ping').onclick=()=>{
    if(raf)cancelAnimationFrame(raf);
    const y1=yOf(+$('dp').value);let t0=null;
    const step=ts=>{t0=t0||ts;const k=Math.min((ts-t0)/1800,1);
      const y=k<.5?16+(y1-16)*(k*2):y1-(y1-16)*((k-.5)*2);
      $('dot').setAttribute('cy',y);if(k<1)raf=requestAnimationFrame(step)};
    raf=requestAnimationFrame(step)};
  upd();
}

/* 7. Simulator keringat: massa menguap = (daya x waktu) / kalor penguapan */
if($('pwr')){
  const Lv=2.4e6; // J/kg, kalor penguapan air pada suhu kulit (pendekatan)
  const upd=()=>{
    const P=+$('pwr').value,m=+$('mnt').value,e=+$('eff').value/100;
    $('pw').textContent=P;$('mn').textContent=m;$('ef').textContent=Math.round(e*100);
    const evap=P*m*60/Lv*1000;       // gram keringat yang harus menguap
    const sweat=evap/e;              // gram keringat yang harus dikeluarkan
    $('ev').textContent=fmt(evap,0);$('sw').textContent=fmt(sweat,0);
    $('gl').textContent=fmt(sweat/200,1);
    $('b3').style.width=Math.min(100,sweat/2500*100)+'%';
  };
  $('pwr').oninput=$('mnt').oninput=$('eff').oninput=upd;upd();
}
