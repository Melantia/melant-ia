(function () {
  'use strict';

  const GestionPagos = {
    calcularBeneficioLiderazgo(usuario) {
      const lista = Array.isArray(usuario?.lista_afiliados)
        ? usuario.lista_afiliados
        : [];
      const activos = lista.filter((item) => item.estado === 'activo');
      const planId =
        usuario?.usuario?.plan_actual || usuario?.plan?.id || 'basico';
      const plan = window.SistemaAfiliados?.planes?.[planId] || {};
      const cuotaBase = Number(plan?.precio || usuario?.plan?.costo || 0);
      const metaGratis = Number(plan?.metaGratis || 0);
      const esComunitario =
        planId === 'comunidad_basico' || planId === 'comunidad_premium';
      const gratis = metaGratis > 0 && activos.length >= metaGratis;
      const cuotaFinal = gratis ? 0 : cuotaBase;
      const excedente = esComunitario
        ? Math.max(activos.length - metaGratis, 0)
        : 0;
      const gananciaExpansion = excedente;
      const restoExpansion = excedente % 5;
      return {
        planId,
        plan,
        activos: activos.length,
        metaGratis,
        gratis,
        cuotaBase,
        cuotaFinal,
        faltanGratis: Math.max(metaGratis - activos.length, 0),
        excedente,
        gananciaExpansion,
        siguienteMeta: gratis ? 5 : Math.max(metaGratis - activos.length, 0),
        faltanSiguienteNivel: gratis
          ? restoExpansion === 0
            ? 5
            : 5 - restoExpansion
          : Math.max(metaGratis - activos.length, 0),
      };
    },

    calcularCuotaMensual(usuario) {
      const beneficio = this.calcularBeneficioLiderazgo(usuario);

      if (beneficio.cuotaFinal === 0 && window.MelantiaVoz?.hablar) {
        window.MelantiaVoz.hablar(
          'Mensaje de Angel: Tu liderazgo ha dado frutos. Este mes tu suscripcion es totalmente gratuita.',
          'angel'
        );
      }
      return beneficio.cuotaFinal;
    },
  };

  window.GestionPagos = GestionPagos;
})();
