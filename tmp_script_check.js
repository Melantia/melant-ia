
/* ══════════════════════════════════════════════════════════════
   CONFIGURACION
══════════════════════════════════════════════════════════════ */
const CONFIG = {
  DB_NAME: 'melant_ia_db',
  DB_VERSION: 1,
  GEO_MAX_KM: 50,
  SYNC_INTERVAL: 30000,
  SESSION_KEY: 'melant_session',
  _PEPPER: 'M3L4NT_RUR4L_2024_K3Y',
  CARBON_GOAL: 24,
  // Compresion de imagen
  IMG_MAX_WIDTH: 800,
  IMG_MAX_HEIGHT: 800,
  IMG_QUALITY: 0.55
};

/* ══════════════════════════════════════════════════════════════
   UTILIDADES
══════════════════════════════════════════════════════════════ */
function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}
function $(s){return document.querySelector(s);}
function $$(s){return document.querySelectorAll(s);}
function todayStr(){return new Date().toISOString().split('T')[0];}
function fmtDate(iso){return new Date(iso).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'});}
function fmtTime(iso){return new Date(iso).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});}

function toast(msg,type='info'){
  const icons={success:'fa-circle-check',error:'fa-circle-xmark',info:'fa-circle-info'};
  const el=document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML='<i class="fa-solid '+icons[type]||icons.info+'"></i><span>'+esc(msg)+'</span>';
  $('#toastBox').appendChild(el);
  setTimeout(()=>el.remove(),3200);
}

let _modalCb=null;
function showModal(title,msg,onConfirm){
  $('#modalTitle').textContent=title;
  $('#modalMsg').textContent=msg;
  $('#modalOverlay').classList.add('show');
  _modalCb=onConfirm;
}
 $('#modalCancel').onclick=()=>{$('#modalOverlay').classList.remove('show');_modalCb=null;};
 $('#modalConfirm').onclick=()=>{$('#modalOverlay').classList.remove('show');if(_modalCb)_modalCb();_modalCb=null;};

/* ══════════════════════════════════════════════════════════════
   BASE DE DATOS — IndexedDB nativo
══════════════════════════════════════════════════════════════ */
const DB={
  db:null,
  STORES:{
    users:{keyPath:'id'},
    fincas:{keyPath:'id',indexes:[['userId','userId']]},
    carbon_fotos:{keyPath:'id',indexes:[['userId','userId'],['synced','synced'],['fecha','fecha']]},
    sync_queue:{keyPath:'id',autoIncrement:true,indexes:[['entity','entity'],['timestamp','timestamp']]},
    actividad:{keyPath:'id',autoIncrement:true,indexes:[['userId','userId']]}
  },
  init(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(CONFIG.DB_NAME,CONFIG.DB_VERSION);
      req.onupgradeneeded=(e)=>{
        const db=e.target.result;
        for(const[name,def]of Object.entries(this.STORES)){
          if(!db.objectStoreNames.contains(name)){
            const store=db.createObjectStore(name,{keyPath:def.keyPath,autoIncrement:def.autoIncrement||false});
            if(def.indexes)def.indexes.forEach(([iname,key])=>store.createIndex(iname,key,{unique:false}));
          }
        }
      };
      req.onsuccess=(e)=>{this.db=e.target.result;resolve();};
      req.onerror=(e)=>reject(e.target.error);
    });
  },
  _store(name,mode){return this.db.transaction(name,mode).objectStore(name);},
  add(name,data){
    return new Promise((res,rej)=>{
      const r=this._store(name,'readwrite').add({...data,id:data.id||Date.now().toString(36)+Math.random().toString(36).slice(2,6)});
      r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);
    });
  },
  put(name,data){
    return new Promise((res,rej)=>{
      const r=this._store(name,'readwrite').put(data);
      r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);
    });
  },
  get(name,key){
    return new Promise((res,rej)=>{
      const r=this._store(name,'readonly').get(key);
      r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);
    });
  },
  getAll(name){
    return new Promise((res,rej)=>{
      const r=this._store(name,'readonly').getAll();
      r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error);
    });
  },
  getByIndex(name,indexName,key){
    return new Promise((res,rej)=>{
      const r=this._store(name,'readonly').index(indexName).getAll(key);
      r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error);
    });
  },
  delete(name,key){
    return new Promise((res,rej)=>{
      const r=this._store(name,'readwrite').delete(key);
      r.onsuccess=()=>res();r.onerror=()=>rej(r.error);
    });
  },
  count(name){
    return new Promise((res,rej)=>{
      const r=this._store(name,'readonly').count();
      r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);
    });
  }
};

/* ══════════════════════════════════════════════════════════════
   CRIPTOGRAFIA — Web Crypto API
══════════════════════════════════════════════════════════════ */
const Crypto={
  async hash(text){
    const enc=new TextEncoder().encode(text);
    const buf=await crypto.subtle.digest('SHA-256',enc);
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  },
  async makeSessionToken(userId){
    return await this.hash(userId+CONFIG._PEPPER+navigator.userAgent.slice(0,40));
  }
};

/* ══════════════════════════════════════════════════════════════
   GEOLOCALIZACION
══════════════════════════════════════════════════════════════ */
const Geo={
  _currentPos:null,
  getCurrent(){return this._currentPos;},
  getPosition(){
    return new Promise((resolve,reject)=>{
      if(!navigator.geolocation)return reject(new Error('GPS no disponible'));
      navigator.geolocation.getCurrentPosition(
        pos=>resolve({lat:pos.coords.latitude,lon:pos.coords.longitude,acc:pos.coords.accuracy}),
        err=>reject(err),
        {enableHighAccuracy:true,timeout:12000,maximumAge:60000}
      );
    });
  },
  haversine(lat1,lon1,lat2,lon2){
    const R=6371;
    const dLat=(lat2-lat1)*Math.PI/180;
    const dLon=(lon2-lon1)*Math.PI/180;
    const a=Math.sin(dLat/2)*2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*2;
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  },
  async checkLock(user){
    if(!user.geoLock||!user.geoLat||!user.geoLon)return true;
    try{
      this._currentPos=await this.getPosition();
      return this.haversine(user.geoLat,user.geoLon,this._currentPos.lat,this._currentPos.lon)<=CONFIG.GEO_MAX_KM;
    }catch(e){console.warn('Geo check fallido:',e.message);return true;}
  },
  async retryLock(){
    const session=JSON.parse(sessionStorage.getItem(CONFIG.SESSION_KEY)||'null');
    if(!session)return;
    const user=await DB.get('users',session.userId);
    if(!user)return;
    const ok=await this.checkLock(user);
    if(ok){$('#geoLockScreen').classList.remove('show');toast('Ubicacion verificada','success');}
  },
  showLock(coords,dist){
    $('#geoCoords').textContent=`${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`;
    $('#geoDistance').textContent=`Distancia: ${dist.toFixed(1)} km del limite permitido`;
    $('#geoLockScreen').classList.add('show');
  }
};

/* ══════════════════════════════════════════════════════════════
   SYNC ENGINE
══════════════════════════════════════════════════════════════ */
const Sync={
  isOnline:navigator.onLine,
  init(){
    window.addEventListener('online',()=>{this.isOnline=true;this.updateUI();});
    window.addEventListener('offline',()=>{this.isOnline=false;this.updateUI();});
    setInterval(()=>this.probe(),CONFIG.SYNC_INTERVAL);
    this.updateUI();
  },
  async probe(){
    if(this.isOnline)return;
    try{
      await fetch('https://httpbin.org/get',{mode:'no-cors',cache:'no-store',signal:AbortSignal.timeout(3000)});
      this.isOnline=true;this.updateUI();
    }catch{/* sigue offline */}
  },
  async enqueue(entity,operation,data){
    await DB.add('sync_queue',{entity,operation,data,timestamp:Date.now()});
    this.updateUI();
  },
  async getPendingCount(){return await DB.count('sync_queue');},
  updateUI(){
    const badge=$('#homeStatus');
    const txt=$('#homeStatusText');
    if(this.isOnline){badge.className='status-badge online';txt.textContent='Conectado';}
    else{badge.className='status-badge offline';txt.textContent='Offline';}
    this.getPendingCount().then(n=>{
      if(n>0&&this.isOnline){badge.className='status-badge syncing';txt.textContent=`Syncing ${n}...`;}
    });
  }
};

/* ══════════════════════════════════════════════════════════════
   AUTENTICACION
══════════════════════════════════════════════════════════════ */
const Auth={
  currentUser:null,
  init(){
    $$('.auth-tab').forEach(tab=>{
      tab.onclick=()=>{
        $$('.auth-tab').forEach(t=>t.classList.remove('active'));
        tab.classList.add('active');
        const isLogin=tab.dataset.tab==='login';
        $('#loginForm').style.display=isLogin?'block':'none';
        $('#registerForm').style.display=isLogin?'none':'block';
        $('#authError').classList.remove('show');
      };
    });
  },
  showAuthError(msg){$('#authError').textContent=msg;$('#authError').classList.add('show');},
  async login(){
    const email=$('#loginEmail').value.trim().toLowerCase();
    const pass=$('#loginPass').value;
    if(!email||!pass)return this.showAuthError('Completa todos los campos');
    if(pass.length<6)return this.showAuthError('Contrasena minimo 6 caracteres');
    const users=await DB.getAll('users');
    const user=users.find(u=>u.email===email);
    if(!user)return this.showAuthError('No existe una cuenta con ese correo');
    const hash=await Crypto.hash(pass);
    if(hash!==user.passHash)return this.showAuthError('Contrasena incorrecta');
    const geoOk=await Geo.checkLock(user);
    if(!geoOk){const pos=Geo.getCurrent();const dist=Geo.haversine(user.geoLat,user.geoLon,pos.lat,pos.lon);Geo.showLock(pos,dist-CONFIG.GEO_MAX_KM);return;}
    await this._startSession(user);
  },
  async register(){
    const name=$('#regName').value.trim();
    const email=$('#regEmail').value.trim().toLowerCase();
    const finca=$('#regFinca').value.trim();
    const pass=$('#regPass').value;
    const geoLock=$('#regGeoLock').checked;
    if(!name||!email||!finca||!pass)return this.showAuthError('Completa todos los campos');
    if(pass.length<6)return this.showAuthError('Contrasena minimo 6 caracteres');
    if(!email.includes('@'))return this.showAuthError('Correo no valido');
    const users=await DB.getAll('users');
    if(users.find(u=>u.email===email))return this.showAuthError('Ya existe una cuenta con ese correo');
    let geoLat=null,geoLon=null;
    if(geoLock){try{const pos=await Geo.getPosition();geoLat=pos.lat;geoLon=pos.lon;}catch{return this.showAuthError('Necesitamos acceso a tu ubicacion');}}
    const passHash=await Crypto.hash(pass);
    const userId=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    const user={id:userId,name,email,finca,passHash,geoLock,geoLat,geoLon,createdAt:new Date().toISOString(),refCode:'ML-'+name.slice(0,3).toUpperCase()+userId.slice(-4).toUpperCase()};
    await DB.add('users',user);
    await DB.add('fincas',{id:'finca_'+userId,userId,nombre:finca,createdAt:new Date().toISOString()});
    await this._startSession(user);
    toast('Cuenta creada exitosamente','success');
  },
  async _startSession(user){
    this.currentUser=user;
    const token=await Crypto.makeSessionToken(user.id);
    sessionStorage.setItem(CONFIG.SESSION_KEY,JSON.stringify({userId:user.id,token}));
    $('#authScreen').classList.remove('show');
    $('#geoLockScreen').classList.remove('show');
    $('#appShell').classList.add('show');
    $('#sidebarName').textContent=user.name;
    $('#sidebarFinca').textContent=user.finca;
    Home.render();
    Router.go('home');
  },
  async restoreSession(){
    const raw=sessionStorage.getItem(CONFIG.SESSION_KEY);
    if(!raw)return false;
    try{
      const session=JSON.parse(raw);
      const user=await DB.get('users',session.userId);
      if(!user)return false;
      const token=await Crypto.makeSessionToken(user.id);
      if(token!==session.token)return false;
      const geoOk=await Geo.checkLock(user);
      if(!geoOk){const pos=Geo.getCurrent();if(pos){const dist=Geo.haversine(user.geoLat,user.geoLon,pos.lat,pos.lon);Geo.showLock(pos,dist-CONFIG.GEO_MAX_KM);}return false;}
      await this._startSession(user);
      return true;
    }catch{return false;}
  },
  logout(){
    showModal('Cerrar sesion','Se cerrara tu sesion en este dispositivo.',()=>{
      this.currentUser=null;
      sessionStorage.removeItem(CONFIG.SESSION_KEY);
      $('#appShell').classList.remove('show');
      $('#authScreen').classList.add('show');
    });
  }
};

/* ══════════════════════════════════════════════════════════════
   ROUTER
══════════════════════════════════════════════════════════════ */
const Router={
  go(view){
    $$('.view').forEach(v=>v.classList.remove('active'));
    $$('.nav-item').forEach(n=>n.classList.remove('active'));
    const el=$(`#view-${view}`);
    const nav=$(`.nav-item[data-view="${view}"]`);
    if(el)el.classList.add('active');
    if(nav)nav.classList.add('active');
    $('#sidebar').classList.remove('open');
    $('#sidebarOverlay').classList.remove('show');
    if(view==='home')Home.render();
    if(view==='carbon')Carbon.render();
  }
};
 $$('.nav-item[data-view]').forEach(item=>item.addEventListener('click',()=>Router.go(item.dataset.view)));
 $('#mobileToggle').onclick=()=>{$('#sidebar').classList.add('open');$('#sidebarOverlay').classList.add('show');};
 $('#sidebarOverlay').onclick=()=>{$('#sidebar').classList.remove('open');$('#sidebarOverlay').classList.remove('show');};

/* ══════════════════════════════════════════════════════════════
   HOME
══════════════════════════════════════════════════════════════ */
const Home={
  async render(){
    if(!Auth.currentUser)return;
    const user=Auth.currentUser;

    // Saludo
    const hour=new Date().getHours();
    let greeting='Buenas noches';
    if(hour>=5&&hour<12)greeting='Buenos dias';
    else if(hour>=12&&hour<19)greeting='Buenas tardes';
    $('#homeGreeting').textContent=greeting+', '+user.name.split(' ')[0];
    $('#homeFincaName').textContent=user.finca;

    // Status
    Sync.updateUI();

    // Escuela progreso (basado en carbon_fotos del usuario)
    const fotos=await DB.getByIndex('carbon_fotos','userId',user.id);
    const totalFotos=fotos.length;
    const pct=Math.min(100,Math.round((totalFotos/CONFIG.CARBON_GOAL)*100));
    $('#homeSchoolProgress').textContent=`${totalFotos}/${CONFIG.CARBON_GOAL} fotos cumplidas`;
    $('#homeSchoolBadge').textContent=pct+'%';

    // Impacto financiero — simulacion basada en fotos de carbono
    // Cada practica regenerativa ahorra ~$35.000 COP vs quimico tradicional
    const ahorroPorFoto=35000;
    const gastoQuimicoBase=totalFotos*ahorroPorFoto*2.2; // Quimico cuesta ~2.2x mas
    const gastoRegen=totalFotos*ahorroPorFoto*0.8; // Regen cuesta ~0.8x
    const ahorro=gastoQuimicoBase-gastoRegen;

    $('#impactQuimico').textContent='$ '+gastoQuimicoBase.toLocaleString('es-CO');
    $('#impactRegen').textContent='$ '+gastoRegen.toLocaleString('es-CO');
    $('#impactSave').textContent='-$ '+ahorro.toLocaleString('es-CO');

    // Barras relativas (max = quimico)
    const maxVal=Math.max(gastoQuimicoBase,1);
    setTimeout(()=>{
      $('#impactQuimicoBar').style.width='100%';
      $('#impactRegenBar').style.width=Math.round((gastoRegen/maxVal)*100)+'%';
    },200);
  }
};

/* ══════════════════════════════════════════════════════════════
   MODULO DE AGRICULTURA REGENERATIVA
   - Camara con compresion
   - GPS automatico
   - Base64 en IndexedDB
   - sync: false por defecto
   - 100% offline
══════════════════════════════════════════════════════════════ */
const Carbon={
  _photoData: null,   // Base64 comprimido
  _gpsData: null,     // {lat, lon, acc}
  _capturing: false,

  openCamera(){
    // Disparar el input de archivo (camara en movil, dialogo en desktop)
    const input=$('#camInput');
    input.value='';
    input.click();
  },

  async render(){
    if(!Auth.currentUser)return;
    const uid=Auth.currentUser.id;
    const fotos=await DB.getByIndex('carbon_fotos','userId',uid);
    const pending=fotos.filter(f=>!f.synced).length;
    const synced=fotos.filter(f=>f.synced).length;
    const total=fotos.length;

    $('#carbonTotal').textContent=total;
    $('#carbonPending').textContent=pending;
    $('#carbonSynced').textContent=synced;

    const pct=Math.min(100,Math.round((total/CONFIG.CARBON_GOAL)*100));
    $('#carbonProgressText').textContent=`${total}/${CONFIG.CARBON_GOAL}`;
    $('#carbonBarFill').style.width=pct+'%';

    const grid=$('#carbonGrid');
    if(total===0){
      grid.innerHTML='<div class="empty-state" style="grid-column:1/-1;"><i class="fa-solid fa-camera"></i><p>Toma tu primera foto de practica regenerativa</p></div>';
      return;
    }

    // Mostrar mas recientes primero
    const sorted=[...fotos].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha));
    grid.innerHTML=sorted.map(f=>`
      <div class="carbon-photo-card">
        <img src="data:image/jpeg;base64,${f.imagenBase64}" alt="Foto carbono ${f.id}" loading="lazy">
        <div class="carbon-photo-body">
          <div class="carbon-photo-meta">
            <span><i class="fa-solid fa-calendar"></i> ${fmtDate(f.fecha)} — ${fmtTime(f.fecha)}</span>
            <span><i class="fa-solid fa-location-dot"></i> ${f.lat.toFixed(5)}, ${f.lon.toFixed(5)}</span>
            <span><i class="fa-solid fa-crosshairs"></i> Precision: ${Math.round(f.accuracy)}m</span>
          </div>
          <div class="carbon-photo-footer">
            <span class="sync-tag ${f.synced?'synced':'pending'}">${f.synced?'Sincronizado':'Pendiente'}</span>
            <button class="btn-del-photo" onclick="Carbon.deletePhoto('${f.id}')" aria-label="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </div>
      </div>
    `).join('');
  },

  async _compressImage(file){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=(e)=>{
        const img=new Image();
        img.onload=()=>{
          const canvas=document.createElement('canvas');
          let w=img.width,h=img.height;
          if(w>CONFIG.IMG_MAX_WIDTH||h>CONFIG.IMG_MAX_HEIGHT){
            const ratio=Math.min(CONFIG.IMG_MAX_WIDTH/w,CONFIG.IMG_MAX_HEIGHT/h);
            w=Math.round(w*ratio);
            h=Math.round(h*ratio);
          }
          canvas.width=w;canvas.height=h;
          const ctx=canvas.getContext('2d');
          ctx.drawImage(img,0,0,w,h);
          const b64=canvas.toDataURL('image/jpeg',CONFIG.IMG_QUALITY).replace('data:image/jpeg;base64,','');
          resolve(b64);
        };
        img.onerror=()=>reject(new Error('No se pudo cargar la imagen'));
        img.src=e.target.result;
      };
      reader.onerror=()=>reject(reader.error);
      reader.readAsDataURL(file);
    });
  },

  async savePhoto(){
    if(!Auth.currentUser||!this._photoData||!this._gpsData)return;
    try{
      const foto={
        id:'foto_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),
        userId:Auth.currentUser.id,
        imagenBase64:this._photoData,
        lat:this._gpsData.lat,
        lon:this._gpsData.lon,
        accuracy:this._gpsData.acc,
        fecha:new Date().toISOString(),
        synced:false
      };
      await DB.add('carbon_fotos',foto);
      await Sync.enqueue('carbon_fotos','CREATE',foto);
      toast('Foto guardada correctamente','success');
      this.closeCamera();
      this._capturing=false;
      $('#btnCapture').classList.remove('capturing');
      $('#btnCapture').innerHTML='<i class="fa-solid fa-camera"></i> Tomar foto';
      this.render();
      Home.render();
    }catch(err){
      console.error('Error guardando foto:',err);
      toast('Error al guardar en base de datos','error');
      this._capturing=false;
      $('#btnCapture').classList.remove('capturing');
      $('#btnCapture').innerHTML='<i class="fa-solid fa-camera"></i> Tomar foto';
    }
  },

  // Se llama cuando el input file selecciona una imagen
  async onFileSelected(file){
    if(!file)return;

    this._capturing=true;
    $('#btnCapture').classList.add('capturing');
    $('#btnCapture').innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';

    try{
      // 1. Comprimir imagen a Base64
      this._photoData=await this._compressImage(file);

      // 2. Obtener GPS automaticamente
      $('#camCoords').classList.add('show');
      $('#camCoordsText').textContent='Obteniendo GPS...';
      $('#camModal').classList.add('show');
      $('#camPlaceholder').style.display='none';

      // Mostrar preview
      const previewImg=document.createElement('img');
      previewImg.src='data:image/jpeg;base64,'+this._photoData;
      previewImg.alt='Preview';
      $('#camPreview').appendChild(previewImg);

      try{
        this._gpsData=await Geo.getPosition();
        $('#camCoordsText').textContent=`${this._gpsData.lat.toFixed(6)}, ${this._gpsData.lon.toFixed(6)} (${Math.round(this._gpsData.acc)}m precision)`;
        $('#camCoords').style.color='var(--green)';
        $('#btnSavePhoto').style.display='flex';
      }catch(gpsErr){
        console.warn('GPS no disponible:',gpsErr.message);
        $('#camCoordsText').textContent='GPS no disponible';
        $('#camCoords').style.color='var(--orange)';
        this._gpsData={lat:0,lon:0,acc:0};
        $('#btnSavePhoto').style.display='flex';
      }
    }catch(err){
      console.error('Error al procesar imagen:',err);
      toast('Error al procesar imagen','error');
      this._capturing=false;
      $('#btnCapture').classList.remove('capturing');
      $('#btnCapture').innerHTML='<i class="fa-solid fa-camera"></i> Tomar foto';
      this.closeCamera();
    }
  },

  async deletePhoto(id){
    showModal('Eliminar foto','Esta foto se eliminara permanentemente de tu dispositivo.',async()=>{
      try{
        await DB.delete('carbon_fotos',id);
        await Sync.enqueue('carbon_fotos','DELETE',{id});
        toast('Foto eliminada','info');
        this.render();
        Home.render();
      }catch(err){
        toast('Error al eliminar','error');
      }
    });
  },

  closeCamera(){
    $('#camModal').classList.remove('show');
    // Limpiar preview
    const preview=$('#camPreview');
    const img=preview.querySelector('img');
    if(img)img.remove();
    $('#camPlaceholder').style.display='';
    $('#camCoords').classList.remove('show');
    $('#btnSavePhoto').style.display='none';
    this._photoData=null;
    this._gpsData=null;
  }
};

// Listener del input de archivo
$('#camInput').addEventListener('change',(e)=>{
  const file=e.target.files[0];
  if(file)Carbon.onFileSelected(file);
});

/* ══════════════════════════════════════════════════════════════
   INICIALIZACION
══════════════════════════════════════════════════════════════ */
async function boot(){
  try{
    // Iniciar IndexedDB
    await DB.init();
    // Iniciar sync
    Sync.init();
    // Iniciar auth
    Auth.init();

    // Ocultar splash
    await new Promise(r=>setTimeout(r,1200));
    $('#splash').classList.add('hidden');

    // Intentar restaurar sesion
    const restored=await Auth.restoreSession();
    if(!restored){
      $('#authScreen').classList.add('show');
    }
  }catch(err){
    console.error('Error de inicializacion:',err);
    $('#splash').classList.add('hidden');
    $('#authScreen').classList.add('show');
    toast('Error al iniciar la aplicacion','error');
  }
}

boot();
