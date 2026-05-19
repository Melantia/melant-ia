window.InventarioBio={
  async addItem(){
    if(!window.Auth||!Auth.currentUser)return;
    const nombre=(document.querySelector('#bioNombre')?.value||'').trim();
    const cantidad=Number(document.querySelector('#bioCantidad')?.value||0);
    const fechaVencimiento=document.querySelector('#bioVencimiento')?.value;
    const proveedor=(document.querySelector('#bioProveedor')?.value||'').trim();
    if(!nombre||cantidad<=0||!fechaVencimiento){
      toast('Ingresa nombre, cantidad y vencimiento del insumo','error');
      return;
    }
    await DB.add('inventario_bio',{
      userId:Auth.currentUser.id,
      nombre,
      cantidad,
      fechaVencimiento:new Date(fechaVencimiento).toISOString(),
      proveedor,
      estado:'activo'
    });
    toast('Insumo biologico registrado','success');
    await this.render();
  },

  async _items(){
    if(!window.Auth||!Auth.currentUser)return [];
    return await DB.getByIndex('inventario_bio','userId',Auth.currentUser.id);
  },

  _daysToExpire(item){
    const ms=new Date(item.fechaVencimiento).getTime()-Date.now();
    return Math.ceil(ms/86400000);
  },

  async consumeForTreatment(nombre,qty){
    const items=await this._items();
    const item=items
      .filter(i=>i.nombre===nombre&&i.estado!=='vencido')
      .sort((a,b)=>new Date(a.fechaVencimiento)-new Date(b.fechaVencimiento))[0];
    if(!item){
      toast(`No hay inventario disponible de ${nombre}`,'error');
      return;
    }
    const restante=Math.max(0,Number(item.cantidad||0)-Number(qty||1));
    await DB.put('inventario_bio',{...item,cantidad:restante,estado:restante<=0?'agotado':item.estado});
    hablar(`Insumo descontado del inventario. Te quedan ${restante} unidades disponibles`);
    if(restante<2){
      hablar(`Te queda solo ${restante} ${restante===1?'unidad':'unidades'} de ${nombre}. ¿Deseas contactar a tu proveedor para no interrumpir el ciclo sanitario?`);
    }
    await this.render();
  },

  async enviarNotificacionVencimiento(item){
    const dias=this._daysToExpire(item);
    if(dias===15){
      hablar('Atención, el hongo Beauveria está por vencer. Prioriza su uso en el próximo lote de ganado');
    }else if(dias<=3&&dias>=0){
      toast('⚠️ Insumo próximo a expirar. No tendrá efecto biológico si pasa la fecha','error');
    }
  },

  async render(){
    const host=document.querySelector('#bioInventarioLista');
    if(!host)return;
    const items=await this._items();
    if(items.length===0){
      host.innerHTML='Sin insumos registrados.';
      return;
    }
    let hayProximos=false;
    const html=[];
    for(const item of items.sort((a,b)=>new Date(a.fechaVencimiento)-new Date(b.fechaVencimiento))){
      const dias=this._daysToExpire(item);
      let color='var(--fg-dim)';
      let estado=item.estado||'activo';
      if(dias<0){ color='#9CA3AF'; estado='vencido'; }
      else if(dias<5){ color='var(--danger)'; hayProximos=true; }
      else if(dias<=15){ color='var(--orange)'; hayProximos=true; }
      else if(Number(item.cantidad||0)<2){ color='var(--orange)'; }
      html.push(`<div style="padding:8px 0;border-bottom:1px solid var(--border);color:${color};"><strong>${item.nombre}</strong> | ${Number(item.cantidad||0)} unidades | vence ${new Date(item.fechaVencimiento).toLocaleDateString('es-ES')} | ${estado}${item.proveedor?` | ${item.proveedor}`:''}</div>`);
      await this.enviarNotificacionVencimiento(item);
    }
    host.innerHTML=html.join('');
    if(hayProximos){
      hablar('Tienes insumos biológicos próximos a vencer. Revisa tu inventario para no perder la inversión');
    }
  }
};
