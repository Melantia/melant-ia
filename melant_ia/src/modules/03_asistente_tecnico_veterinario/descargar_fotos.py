# -*- coding: utf-8 -*-
"""
Extractor de referencias bibliograficas para MELANT IA
Crea un archivo .txt por cada referencia con su contenido.
"""
import os
import subprocess
import sys

def instalar(pkg):
    subprocess.check_call([sys.executable, "-m", "pip", "install", pkg, "--quiet"])

try:
    import requests
except ImportError:
    instalar("requests"); import requests

try:
    from bs4 import BeautifulSoup
except ImportError:
    instalar("beautifulsoup4"); from bs4 import BeautifulSoup

# =====================================================================
# REFERENCIAS — solo las que tienen URL accesible
# =====================================================================
REFERENCIAS = [
    {
        "archivo": "Andrade-Yucailla_2017_pollos_camperos_Ecuador",
        "cita": "Andrade-Yucailla et al. (2017). Comportamiento productivo de dos fenotipos de pollos camperos en la region Amazonica de Ecuador. Revista Amazonica, 6(1), 1-8.",
        "url": "https://doi.org/10.59410/RACYT-v06n01ep01-0075"
    },
    {
        "archivo": "Angarita_Castrillon_2020_gallinas_criollas",
        "cita": "Angarita, L., y Castrillon, Z. (2020). Produccion agroecologica de gallinas criollas. Corporacion Universitaria Minuto de Dios.",
        "url": "https://semillas.org.co/apc-aa-files/5d99b14191c59782eab3da99d8f95126/sin-prueba_compressed-1.pdf"
    },
    {
        "archivo": "Estevez_2007_density_broilers",
        "cita": "Estevez, I. (2007). Density Allowances for Broilers: Where to Set the Limits? Poultry Science, 86(6), 1265-1272.",
        "url": "https://doi.org/10.1093/ps/86.6.1265"
    },
    {
        "archivo": "FAO_2015_integrated_backyard_systems",
        "cita": "FAO. (2015). Integrated backyard systems.",
        "url": "https://www.fao.org/agriculture/animal-production-and-health/en/"
    },
    {
        "archivo": "Gallard_2022_densidad_alojamiento_bienestar_parrilleros",
        "cita": "Gallard et al. (2022). Efecto de la densidad de alojamiento sobre bienestar en pollos parrilleros. Revista Veterinaria, 33(2), 230.",
        "url": "https://doi.org/10.30972/vet.3326188"
    },
    {
        "archivo": "Goo_2019_stocking_density_broiler",
        "cita": "Goo et al. (2019). Effect of stocking density and sex on growth performance in broiler chickens. Poultry Science, 98(3), 1153-1160.",
        "url": "https://doi.org/10.3382/ps/pey491"
    },
    {
        "archivo": "Hernandez-Cabrera_2015_pastoreo_gallinas_malezas",
        "cita": "Hernandez-Cabrera, C. (2015). Efecto del pastoreo de gallinas en el control de malezas. Escuela Agricola Panamericana, Zamorano.",
        "url": "https://bdigital.zamorano.edu/server/api/core/bitstreams/3a84a03d-8725-4ccf-acfa-cdcab82a3a8e/content"
    },
    {
        "archivo": "Jaramillo_2018_parametros_productivos_huevo",
        "cita": "Jaramillo et al. (2018). Evaluacion de los parametros productivos y calidad del huevo de gallina en dos sistemas de alojamiento. CBA.",
        "url": "https://hdl.handle.net/11404/5291"
    },
    {
        "archivo": "Phillips_Engel_2002_agroforestry_chicken",
        "cita": "Phillips, I., y Engel, C. (2002). Development of an agroforestry system for chicken production. COR Conference.",
        "url": "https://orgprints.org/id/eprint/8417/"
    },
    {
        "archivo": "Shim_2012_growth_rate_leg_morphology_broilers",
        "cita": "Shim et al. (2012). The effects of growth rate on leg morphology and tibia breaking strength in broilers. Poultry Science, 91(8), 1790-1795.",
        "url": "https://doi.org/10.3382/ps.2011-01968"
    },
    {
        "archivo": "IGA_caprinocultura_Ecuador",
        "cita": "International Goat Association. La caprinocultura en Ecuador: un sector prospero y emergente. Crianza de cabras para leche, carne o doble proposito en la region Sur.",
        "url": "https://www.iga-goatworld.com/uploads/tierras_altas_nov_2014.pdf"
    },
    {
        "archivo": "MSD_reproduccion_parto_cabras",
        "cita": "MSD Veterinary Manual. Reproduccion y parto de las cabras - Manejo y nutricion. Exploraciones fisicas antes de la epoca de cria.",
        "url": "https://www.msdvetmanual.com/es/manejo-y-nutricion/manejo-de-las-cabras/reproduccion-y-parto-de-las-cabras"
    },
    {
        "archivo": "Aguirre-Riofrio_2025_rendimiento_canal_cabra_Ecuador",
        "cita": "Aguirre-Riofrio, E.L. (2025). Rendimiento a la canal en la cabra manejada a campo abierto en el sur de Ecuador. Universidad Central del Ecuador.",
        "url": "https://revistadigital.uce.edu.ec/index.php/SIEMBRA/article/view/4966"
    },
    {
        "archivo": "Sagal_Sosoranga_2025_cabras_criollas_UNESUM",
        "cita": "Sagal Sosoranga, M.N. (2025). Cria de cabras criollas actividad fundamental para familias, complementando cultivos como maiz y cafe. UNESUM.",
        "url": "https://repositorio.unesum.edu.ec/bitstream/53000/4623/1/UNESUM-ECU-AGROPECUARIA-2025-38.pdf"
    },
    {
        "archivo": "UAE_crianza_cabras_tecnificada",
        "cita": "Universidad Agraria del Ecuador. Crianza de cabras bajo procesos tecnificados y control sanitario. 108 paginas.",
        "url": "https://cia.uagraria.edu.ec/Archivos/VERA%20MORA%20JONATAN%20SAUL.pdf"
    },
    {
        "archivo": "Morales_2025_entorno_social_productivo_caprinos_UTC",
        "cita": "Morales, J.B. (2025). Determinacion del entorno social y productivo de caprinos criollos (Capra hircus) en familias rurales. Universidad Tecnica de Cotopaxi.",
        "url": "https://investigacion.utc.edu.ec/dateh/article/view/68"
    },
    {
        "archivo": "AICA_2023_produccion_leche_cabras_criollas",
        "cita": "AICA (2023). Produccion de leche de cabras criollas en Ecuador. Cabra Criolla genotipo de interes para la conservacion del bosque.",
        "url": "https://s59b6fdfe9e4460e7.jimcontent.com/download/version/1687298986/module/14395206073/name/40-PRODUCCION-DE-LECHE-DE-CABRAS-CRIOLLAS-EN-LA.pdf"
    },
    {
        "archivo": "Lucas_2020_tipificacion_sistemas_caprinos_UPS",
        "cita": "Lucas, L.A.S. (2020). Tipificacion integral de sistemas caprinos. Producto principal: carne; pocos obtienen leche. Universidad Politecnica Salesiana.",
        "url": "https://lagranja.ups.edu.ec/index.php/granja/article/view/31.2020.05"
    },
    {
        "archivo": "CIAP_manual_produccion_porcicola",
        "cita": "Centro de Informacion de Actividades Porcinas. Manual de produccion porcicola. Habilidades maternas de la cerda durante lactancia. 114 paginas.",
        "url": "https://www.ciap.org.ar/Sitio/Archivos/Manual%20de%20produccion%20porcicola.pdf"
    },
    {
        "archivo": "Corpmontana_2023_reproduccion_cerdos",
        "cita": "Corpmontana (2023). Reproduccion de cerdos: guia completa. Tecnicas para la cria de cerdas reproductoras: apareamiento e inseminacion artificial.",
        "url": "https://www.corpmontana.com/m-conecta/porcicultura/"
    },
    {
        "archivo": "3tres3_sistema_produccion_sitio_multiple_cerdos",
        "cita": "3tres3.com. Sistema de produccion en un sitio y en multiples sitios. Las 3 fases de produccion: historia y forma tradicional de produccion de cerdos.",
        "url": "https://www.3tres3.com/latam/articulos/sistema-de-produccion-en-un-sitio-y-en-multiples-sitios_36533/"
    },
    {
        "archivo": "Agrotendencia_cria_cerdos_potreros",
        "cita": "Agrotendencia.tv. Cria de cerdos: manejo en potreros, instalaciones y ventajas. Produccion porcina a campo abierto.",
        "url": "https://agrotendencia.tv/agropedia/la-cria-de-cerdos/"
    },
    {
        "archivo": "Digesa_guia_crianza_sanitaria_cerdos",
        "cita": "Digesa - MINSA Peru. Guia Para La Crianza Sanitaria de Cerdos. Crianza tradicional no tecnificada basada en conocimientos empiricos. 24 paginas.",
        "url": "https://www.digesa.minsa.gob.pe/publicaciones/descargas/crianza_cerdos.pdf"
    },
    {
        "archivo": "Asobanca_2022_guia_granja_cerdos_Ecuador",
        "cita": "Asociacion de Bancos Privados del Ecuador (2022). Guia de Granja de Cerdos. Principales procesos productivos en granjas porcinas. 62 paginas.",
        "url": "https://asobanca.org.ec/uploads/2022/12/1.-Gu%C3%ADa-de-Granja-de-Cerdos.pdf"
    },
    {
        "archivo": "GranjasSanAntonio_2023_proceso_productivo_cerdos",
        "cita": "Granjas San Antonio (2023). El proceso productivo en una granja de cerdos ecologicos: inseminacion, gestacion, parto, destete, cebado, matadero y curado.",
        "url": "https://granjassanantonio.com/el-proceso-productivo-en-una-granja-de-cerdos-ecologicos/"
    },
    {
        "archivo": "DehesaBaronDeLey_2021_fases_crianza_cerdo_iberico",
        "cita": "Dehesa Baron De Ley (2021). El cerdo iberico: fases de su crianza. Destete y recria hasta que los cochinos alcanzan el peso de mercado.",
        "url": "https://www.dehesabarondeley.com/el-cerdo-iberico-conoces-las-fases-de-su-crianza/"
    },
    {
        "archivo": "Corpmontana_2023_reproduccion_cerdas_tecnicas",
        "cita": "Corpmontana (2023). Reproduccion de cerdos: guia completa para su manejo. Tecnicas de cria de cerdas reproductoras segun entrega de semen.",
        "url": "https://www.corpmontana.com/m-conecta/porcicultura/"
    },
    {
        "archivo": "ProduccionAnimal_manejo_produccion_porcino",
        "cita": "Produccion-animal.com.ar. Manejo y produccion de porcino. Ciclo productivo: primera cubricion fertil entre 7 y 8 meses, ciclo sexual de 21 dias, gestacion.",
        "url": "http://www.produccion-animal.com.ar/produccion_porcina/00-produccion_porcina_indice.htm"
    },
    {
        "archivo": "EscuelaCortadores_ciclo_vida_cerdo",
        "cita": "Escuela Nacional de Cortadores de Jamon de Espana. El ciclo de vida natural del cerdo: nacimiento, lactancia (0-4 semanas), destete (4+ semanas).",
        "url": "https://www.escuelanacionalcortadores.es/el-ciclo-de-vida-natural-del-cerdo/"
    },
    {
        "archivo": "UMinnesota_alimentacion_cerdo_ecologico",
        "cita": "University of Minnesota Twin Cities. Programas de alimentacion carne de cerdo ecologica. Temperatura, espacio, nutricion y ventilacion para limitar estres.",
        "url": "https://extension.umn.edu/organic-feed-and-nutrition/organic-swine-feeding-programs"
    },
    {
        "archivo": "INIAP_produccion_porcina_Ecuador_distribucion",
        "cita": "Instituto Nacional de Investigaciones Agropecuarias (INIAP). La produccion porcina en el Ecuador: distribucion regional, 50.1% region Andina y 47.4% region Costa.",
        "url": "https://repositorio.iniap.gob.ec/bitstream/41000/6183/1/iniapsc377.pdf"
    },
    {
        "archivo": "Cayambe-Padilla_2022_sistemas_manejo_porcino_SciELO",
        "cita": "Cayambe-Padilla, M.A. et al. (2022). Sistemas de manejo de la produccion porcina. Caso Ecuador: disminucion de 856.396 cabezas entre 2014 y 2021. SciELO Venezuela.",
        "url": "http://ve.scielo.org/scielo.php?script=sci_arttext&pid=S1315-01402022000100001"
    },
    {
        "archivo": "Rotecna_Ecuador_incrementa_produccion_porcina_15_anos",
        "cita": "Rotecna (2024). Ecuador incrementa su produccion porcina en los ultimos 15 anos. Consumo per capita de carne de cerdo en aumento. Rotecna.com.",
        "url": "https://www.rotecna.com/es/actualidad/ecuador-incrementa-su-produccion-porcina-en-los-ultimos-15-anos/"
    },
    {
        "archivo": "MAGAP_2024_Ecuador_exporta_carne_cerdo",
        "cita": "Ministerio de Agricultura y Ganaderia del Ecuador (2024). Ecuador exporta por segunda vez carne de cerdo. Trabajo conjunto sector privado y publico. MAGAP.",
        "url": "https://www.agricultura.gob.ec/ecuador-exporta-por-segunda-vez-carne-de-cerdo/"
    },
    {
        "archivo": "ElProductor_porcicultura_Ecuador_crecimiento",
        "cita": "El Productor Ecuador. Produccion porcina crecio pese a inseguridad y contrabando. Porcicultura abastece 99% del consumo nacional. El Productor Ecuador.",
        "url": "https://www.elproductor.com/noticias/produccion-porcina-crecio-pese-a-inseguridad-y-contrabando/"
    },
    {
        "archivo": "UTB_granjas_porcinas_Ecuador_factores_crecimiento",
        "cita": "Universidad Tecnica de Babahoyo. Granjas porcinas en Ecuador: mayoria son pequenas granjas familiares. Factores que influyen en crecimiento y desarrollo del sector.",
        "url": "https://dspace.utb.edu.ec/bitstream/handle/49000/13965/P-UTB-FACIAG-AGR-000424.pdf"
    },
    {
        "archivo": "FENAVI_2019_sanidad_industria_avicola",
        "cita": "FENAVI - Federacion Nacional de Avicultores de Colombia (2019). Sanidad en la industria avicola. Enfermedades segun zona geografica y nivel de bioseguridad. 60 paginas.",
        "url": "https://fenavi.org/uploads/2019/02/SANIDAD-EN-LA-INDUSTRIA-AVICOLA.pdf"
    },
    {
        "archivo": "Avinews_2025_protocolos_bioseguridad_pollos_engorde",
        "cita": "Avinews (2025). Protocolos de bioseguridad en el manejo de pollos de engorde. Ropa exclusiva, botas desinfectadas, pediluvios y control de acceso a granja.",
        "url": "https://avinews.com/protocolos-de-bioseguridad-en-el-manejo-de-pollos-de-engorde/"
    },
    {
        "archivo": "Agrocalidad_2023_manual_buenas_practicas_pollos_engorde",
        "cita": "Agrocalidad (2023). Manual de Aplicabilidad de Buenas Practicas de Produccion Avicola. Pollos de engorde sensibles al estres por calor. Bienestar animal. 154 paginas.",
        "url": "https://www.agrocalidad.gob.ec/wp-content/uploads/2023/02/Manual-de-Aplicabilidad-de-Buenas-Practicas-Pollos-de-Engorde.pdf"
    },
    {
        "archivo": "Aviagen_manual_manejo_pollos_engorde_espanol",
        "cita": "Aviagen. Manual de Manejo de Pollos de Engorde. Guia tecnica para optimizar el rendimiento de pollos de engorde. Manejo de temperatura y ventilacion. 144 paginas.",
        "url": "https://aviagen.com/assets/Tech_Center/Broiler_Management/2022-BB-BroilerPOGuide-Spanish.pdf"
    },
    {
        "archivo": "Adiveter_bioseguridad_granjas_avicolas",
        "cita": "Adiveter. Bioseguridad en granjas avicolas. Limpieza, lavado, desinfeccion y flameado a fondo del galpon antes de introducir nuevas aves.",
        "url": "https://www.adiveter.com/ftp_public/articulo1707.pdf"
    },
    {
        "archivo": "CertifiedHumane_2025_enfermedades_pollos_engorde",
        "cita": "Certified Humane Latino (2025). Como prevenir las enfermedades que afectan a los pollos de engorde. Enfermedad de Newcastle, bronquitis infecciosa y otras.",
        "url": "https://certifiedhumanelatino.com/como-prevenir-las-enfermedades-que-afectan-a-los-pollos-de-engorde/"
    },
    {
        "archivo": "MerckVetManual_2024_programas_vacunacion_aves_produccion",
        "cita": "Merck Veterinary Manual (2024). Programas de vacunacion para aves de produccion - Aves de corral. Tabla de vacunacion para reproductoras de pollos de engorde.",
        "url": "https://www.msdvetmanual.com/es/aves-de-corral/vacunacion-de-aves-de-corral/programas-de-vacunacion-para-aves-de-produccion"
    },
    {
        "archivo": "Zoomalia_2024_limpieza_gallinero_9_consejos",
        "cita": "Zoomalia (2024). Limpieza del gallinero: 9 consejos para un buen mantenimiento. Frecuencia de limpieza, ventilacion diaria y retiro de esterco.",
        "url": "https://www.zoomalia.es/blog/limpieza-gallinero/"
    },
    {
        "archivo": "UMN_Extension_pasture_raised_poultry_management",
        "cita": "University of Minnesota Extension. Manejo seguro de aves de pastoreo. Practicas seguras en el manejo de aves de corral en sistemas de pastoreo.",
        "url": "https://extension.umn.edu/pasture-raised-poultry/pasture-raised-poultry"
    },
    {
        "archivo": "WATTPoultry_2016_gallinas_libres_riesgos_sanidad_aviar",
        "cita": "WATT Poultry (2016). Gallinas libres y los riesgos para la sanidad aviar. Produccion avicola de traspatio sin galpones o jaulas: mayor incidencia de brotes. WattAgNet.com.",
        "url": "https://www.wattagnet.com/egg-production/article/15527946/gallinas-libres-y-los-riesgos-para-la-sanidad-aviar"
    },
    {
        "archivo": "Avinews_2026_sanidad_procesamiento_avicola_inocuidad",
        "cita": "Avinews (2026). Sanidad en el procesamiento avicola: clave para la inocuidad alimentaria. Protocolos de higiene, control de agua y equipos en planta procesadora.",
        "url": "https://avinews.com/sanidad-en-el-procesamiento-avicola-clave-para-la-inocuidad-alimentaria/"
    },
    {
        "archivo": "Agrocalidad_2020_guia_buenas_practicas_avicolas",
        "cita": "Agrocalidad (2020). Guia de buenas practicas avicolas. Temperatura, luz, ventilacion, limpieza y sanitizacion para el desarrollo de las aves. 45 paginas.",
        "url": "https://www.agrocalidad.gob.ec/wp-content/uploads/2020/05/pecu-guia-buenas-practicas-avicolas.pdf"
    },
    {
        "archivo": "Terranimal_2023_bienestar_gallinas_ponedoras_libre_pastoreo",
        "cita": "Terranimal Ecuador (2023). Bienestar Animal de Gallinas Ponedoras y Produccion de Huevos en Libre Pastoreo. Personal capacitado, manejo y asesoria veterinaria. 110 paginas.",
        "url": "https://gallinasfelices.terranimal.ec/wp-content/uploads/2023/07/Terranimal-Bienestar-Animal-Gallinas-Ponedoras-Libre-Pastoreo.pdf"
    },
    {
        "archivo": "AmericanHumane_2025_normas_bienestar_gallinas_ponedoras",
        "cita": "American Humane Society (2025). Normas de bienestar animal para gallinas ponedoras. Acceso libre al campo o pastoreo al menos 275 dias al ano. 137 paginas.",
        "url": "https://www.americanhumane.org/wp-content/uploads/2025/03/American-Humane-Laying-Hen-Standards.pdf"
    },
    {
        "archivo": "AgroProductividad_libre_pecoreo_gallinas_Gallus",
        "cita": "Revista Agro Productividad. El sistema de libre pecoreo en gallinas Gallus domesticus. Aves libres de enfermedades y lesiones, buena nutricion, eliminacion del sufrimiento.",
        "url": "https://revista-agroproductividad.org/index.php/agrop/article/download/1978/1763"
    },
    {
        "archivo": "UAE_2025_enfermedades_respiratorias_aves_traspatio",
        "cita": "Universidad Agraria del Ecuador (2025). Enfermedades respiratorias en aves de traspatio, parroquia Eloy Alfaro. Analisis de presencia y prevalencia. 73 paginas.",
        "url": "https://cia.uagraria.edu.ec/Archivos/ENFERMEDADES-RESPIRATORIAS-AVES-TRASPATIO.pdf"
    },
    {
        "archivo": "PazyDesarrollo_2020_manual_produccion_manejo_aves",
        "cita": "Paz y Desarrollo (2020). Manual Practico para la Produccion y Manejo de Aves. Nutricion, alimentacion, instalaciones, equipo y sanidad para produccion limpia. 36 paginas.",
        "url": "https://www.pazydesarrollo.org/wp-content/uploads/2020/09/Manual-practico-produccion-manejo-aves.pdf"
    },
    {
        "archivo": "Agrotendencia_2025_lombricultura_ganaderia_regenerativa",
        "cita": "Agrotendencia.tv (2025). Lombricultura en ganaderia regenerativa: estrategia holistica. La ganaderia regenerativa como enfoque que convierte los residuos en recursos.",
        "url": "https://agrotendencia.tv/ganaderia/lombricultura-en-ganaderia-regenerativa-conoce-su-estrategia/"
    },
    {
        "archivo": "Agrotendencia_2026_cria_cerdos_campo_manejo_potreros",
        "cita": "Agrotendencia.tv (2026). Cria de cerdos a campo: manejo en potreros y ventajas. Sistema que permite a los animales satisfacer sus necesidades naturales de comportamiento y confort.",
        "url": "https://agrotendencia.tv/agropedia/la-cria-de-cerdos-a-campo-cria-y-manejo/"
    },
    # --- PORCICULTURA REGENERATIVA ---
    {
        "archivo": "MundoAgropecuario_2025_agricultura_regenerativa_porcicultura",
        "cita": "Mundo Agropecuario (2025). Agricultura regenerativa y porcicultura: juntas funcionan. Mejora de biodiversidad en pasturas y microbiota del suelo con rotacion porcina.",
        "url": "https://mundoagropecuario.com/agricultura-regenerativa-y-porcicultura-juntas-funcionan/"
    },
    {
        "archivo": "Alltech_2023_produccion_porcina_ecologica_oportunidades",
        "cita": "Alltech (2023). La produccion porcina ecologica trae oportunidades de crecimiento. Manejo de recursos, alimentacion y cria de cerdos en sistemas ecologicos.",
        "url": "https://www.alltech.com/blog/la-produccion-porcina-ecologica-trae-oportunidades-de-crecimiento"
    },
    {
        "archivo": "SIGNUS_2022_ganaderia_regenerativa_alternativa_macrogranjas",
        "cita": "SIGNUS (2022). Ganaderia regenerativa: La alternativa a las macrogranjas. Densidad de 614 cerdos/km2 en comarcas mas contaminadas. Comision Europea.",
        "url": "https://blog.signus.es/ganaderia-regenerativa-la-alternativa-a-las-macrogranjas/"
    },
    {
        "archivo": "Garimori_2025_cerdo_iberico_agricultura_regenerativa",
        "cita": "Garimori Guijuelo (2025). La adaptacion del cerdo iberico a la agricultura regenerativa. Modelo de recuperacion del suelo, biodiversidad y mejora de ecosistemas.",
        "url": "https://www.garimori.es/la-adaptacion-del-cerdo-iberico-a-la-agricultura-regenerativa/"
    },
    {
        "archivo": "3tres3_2005_produccion_porcina_ecologica_cambios_productivos",
        "cita": "3tres3.com (2005). La produccion porcina ecologica. Conjunto de cambios en alimentacion, manejo y sanidad en la cria de cerdos ecologicos.",
        "url": "https://www.3tres3.com/latam/articulos/la-produccion-porcina-ecologica_2066/"
    },
    {
        "archivo": "LaCarneDePasto_2022_ecoibericos_produccion_porcina_ecologica",
        "cita": "LaCarneDePasto (2022). Ecoibericos: 25 anos de produccion porcina ecologica y a pastoreo. Ciclo cerrado desde la cria hasta la comercializacion.",
        "url": "https://www.lacarnedepasto.com/2022/07/20/ecoibericos-25-anos-de-produccion-porcina-ecologica-y-a-pastoreo/"
    },
    {
        "archivo": "ElSitioPorcino_manejo_sanitario_ambiente_cerdas",
        "cita": "El Sitio Porcino. Manejo del ambiente y manejo sanitario y tratamiento de cerdas reproductoras. Sistema de movimiento de cerdas por fases productivas.",
        "url": "https://www.elsitioporcino.com/publications/manejo/manejo-del-ambiente-manejo-sanitario-y-tratamiento-de/"
    },
    {
        "archivo": "Agrocalidad_2022_guia_buenas_practicas_porcicolas",
        "cita": "Agrocalidad (2022). Guia de Buenas Practicas Porcicolas. Manejo que promueve productividad, bienestar y salud de los cerdos. Subproductos y registros. 72 paginas.",
        "url": "https://www.agrocalidad.gob.ec/wp-content/uploads/2022/02/pecu2-guia-buenas-practicas-porcicolas.pdf"
    },
    {
        "archivo": "ESPOCH_2023_porcicultura_manejo_sanitario_genetico_Ecuador",
        "cita": "Escuela Superior Politecnica de Chimborazo ESPOCH (2023). Porcicultura: crianza, produccion y reproduccion de cerdos. Manejo sanitario y genetico para carne de calidad.",
        "url": "https://dspace.espoch.edu.ec/bitstream/123456789/19374/1/23T0785.pdf"
    },
    {
        "archivo": "MSDVetManual_interaccion_salud_manejo_cerdos",
        "cita": "MSD Veterinary Manual. Interaccion entre la salud y el manejo en cerdos. Uso de registros de produccion como parte esencial del programa de salud de la piara.",
        "url": "https://www.msdvetmanual.com/es/manejo-y-nutricion/manejo-de-los-cerdos/interaccion-entre-la-salud-y-el-manejo-cerdos"
    },
    {
        "archivo": "CREAF_2022_ganaderia_extensiva_regenerativa_caracteristicas",
        "cita": "CREAF (2022). Sobre la ganaderia extensiva y regenerativa. Caracteristicas de los principales tipos de animales domesticos de granja: rumiantes, cerdos, gallinas.",
        "url": "https://www.creaf.cat/es/articulos/sobre-la-ganaderia-extensiva-y-regenerativa"
    },
    {
        "archivo": "Engormix_2023_ganaderia_regenerativa_beneficios_pastoreo",
        "cita": "Engormix (2023). Ganaderia regenerativa: beneficios y soluciones. Manejo de pastoreo y su impacto en produccion porcina y avicola.",
        "url": "https://www.engormix.com/ganaderia/manejo-pastoreo/articulos/ganaderia-regenerativa-beneficios-soluciones/"
    },
    # --- CAPRINOS - SANIDAD ---
    {
        "archivo": "FAO_guia_manejo_sanitario_reproductivo_cabras",
        "cita": "FAO. Guia para el Manejo Sanitario y Reproductivo de las Cabras. Aspectos clave en manejo sanitario y reproductivo de cabras lecheras y de carne.",
        "url": "https://openknowledge.fao.org/server/api/core/bitstreams/manejo-sanitario-cabras/content"
    },
    {
        "archivo": "COVIHER_2023_ganaderia_regenerativa_caprino_ovino",
        "cita": "COVIHER (2023). La Ganaderia Regenerativa en el caprino-ovino. Ventajas de la cria de cabras y ovejas frente a otro tipo de ganado en sistemas regenerativos.",
        "url": "https://coviher.com/ganaderia-regenerativa-en-el-caprino-ovino/"
    },
    {
        "archivo": "ProduccionAnimal_manejo_sanitario_hato_caprino",
        "cita": "Produccion-animal.com.ar. Manejo Sanitario del Hato Caprino. Cabras adultas infectadas como portadoras; vacunas en gestantes 30 dias antes del parto. 11 paginas.",
        "url": "http://www.produccion-animal.com.ar/produccion_caprina/02-manejo_sanitario_caprino.pdf"
    },
    {
        "archivo": "MSDVetManual_manejo_general_cabras_nutricion",
        "cita": "MSD Veterinary Manual. Manejo general de las cabras. Inspeccion frecuente para controlar signos clinicos de enfermedad, lesiones y condicion corporal.",
        "url": "https://www.msdvetmanual.com/es/manejo-y-nutricion/manejo-de-las-cabras/descripcion-general-del-manejo-de-las-cabras"
    },
    {
        "archivo": "MSDVetManual_atencion_sanitaria_preventiva_cabras",
        "cita": "Merck Veterinary Manual. Descripcion general de la atencion sanitaria preventiva y programa de vacunacion en cabras. Produccion de carne de cabra a nivel mundial.",
        "url": "https://www.merckvetmanual.com/es/manejo-y-nutricion/manejo-de-las-cabras/descripcion-general-de-la-atencion-sanitaria-preventiva-y-programa-de-vacunacion-en-cabras"
    },
    {
        "archivo": "NADIS_salud_caprina_vacunas_desparasitantes",
        "cita": "NADIS Animal Health. Salud Caprina: inyecciones subcutaneas para vacunas y desparasitantes. Puntos de aplicacion en cabras adultas y jovenes.",
        "url": "https://www.nadis.org.uk/es/disease-a-z/goats/goat-health-4-preventative-healthcare/"
    },
    {
        "archivo": "Agrocalidad_2025_programa_nacional_sanitario_ovinos_caprinos",
        "cita": "Agrocalidad (2025). Resolucion 0255 - Programa Nacional Sanitario de Ovinos y Caprinos. Prevencion, control y parametros sanitarios para estas especies. 32 paginas.",
        "url": "https://www.agrocalidad.gob.ec/wp-content/uploads/2025/04/Resolucion-0255-Programa-Nacional-Sanitario-de-ovinos-caprinos.pdf"
    },
    {
        "archivo": "FAO_salud_ovina_caprina_condicion_corporal_alimentacion",
        "cita": "FAO. Salud ovina y caprina. Importancia de la condicion corporal y la alimentacion adecuada como tratamiento preventivo de enfermedades.",
        "url": "https://www.fao.org/livestock/agap/frg/AHBL/doc/smallruminants_health.htm"
    },
    {
        "archivo": "UTB_2023_manejo_sanitario_rumiantes_menores_ovejas_cabras",
        "cita": "Universidad Tecnica de Babahoyo UTB (2023). Manejo sanitario en la produccion de rumiantes menores. Salud, bienestar y prevencion en ovejas y cabras.",
        "url": "https://dspace.utb.edu.ec/bitstream/handle/49000/15742/manejo-sanitario-rumiantes-menores.pdf"
    },
    # --- CUYES ---
    {
        "archivo": "FAO_sanidad_cuyes_cap7_mortalidad_prevencion",
        "cita": "FAO. Capitulo 7: Sanidad en cuyes. Mortalidad en la crianza de cuyes como consecuencia del desconocimiento de alternativas de manejo sanitario.",
        "url": "https://www.fao.org/3/w6562s/w6562s09.htm"
    },
    {
        "archivo": "FAO_alimentacion_cuyes_agua_suministro",
        "cita": "FAO. Alimentacion de cuyes y conejos. Suministro de agua: el cuy necesita 120 cc de agua por cada 40 g de alimento consumido.",
        "url": "https://www.fao.org/3/w6562s/w6562s10.htm"
    },
    {
        "archivo": "Procampo_manejo_sanitario_bioseguridad_cuyes",
        "cita": "Procampo Ecuador. Manejo sanitario y bioseguridad en la explotacion de cuyes. Limpieza del alojamiento; poza o jaula vacia minimo dos semanas luego del lavado.",
        "url": "https://www.procampo.com.ec/blog/11-salud/239-manejo-sanitario-y-bioseguridad-en-la-explotacion-de-cuyes"
    },
    {
        "archivo": "Agrocalidad_2022_guia_buenas_practicas_cuyes_Ecuador",
        "cita": "Agrocalidad (2022). Guia de Buenas Practicas Pecuarias en la Produccion de Cuyes. Requerimientos minimos de inocuidad en crianza, manejo y alimentacion de Cavia porcellus. 31 paginas.",
        "url": "https://www.agrocalidad.gob.ec/wp-content/uploads/2022/02/pecu5-guia-buenas-practicas-pecuarias-cuyes.pdf"
    },
    {
        "archivo": "HumanaEcuador_2021_manual_manejo_cuyes_forraje",
        "cita": "Fundacion Humana Pueblo a Pueblo Ecuador (2021). Manual de Manejo de Cuyes. Importancia de la produccion forrajera para produccion de crias y salud. 100 paginas.",
        "url": "https://humana-ecuador.org/uploads/2021/09/Publicacion-Manual-de-Manejo-de-Cuyes.pdf"
    },
    {
        "archivo": "CEDEPAS_manual_tecnico_crianza_cuyes_4_pilares",
        "cita": "CEDEPAS Norte. Manual Tecnico de Crianza de Cuyes. Cuatro pilares: alimentacion, genetica, manejo y sanidad para una crianza eficaz. 26 paginas.",
        "url": "https://www.cedepas.org.pe/sites/default/files/manual-tecnico-crianza-cuyes.pdf"
    },
    {
        "archivo": "MIDAGRI_manual_bioseguridad_sanidad_cuyes_enfermedades",
        "cita": "MIDAGRI Peru. Manual de bioseguridad y sanidad en cuyes. Principios de bioseguridad y principales enfermedades en la crianza de cuyes. 90 paginas.",
        "url": "https://repositorio.midagri.gob.pe/bitstream/MIDAGRI/20/1/Huancavelica-Manual-Bioseguridad-Sanidad-Cuyes.pdf"
    },
    {
        "archivo": "UNL_2024_sistemas_produccion_cuyes_piojos_acaros",
        "cita": "Universidad Nacional de Loja (2024). Caracterizacion de los sistemas de produccion de cuyes. Piojos y acaros son los problemas sanitarios mas frecuentes (85%).",
        "url": "https://dspace.unl.edu.ec/bitstreams/caracterizacion-sistemas-produccion-cuyes/download"
    },
    {
        "archivo": "CrianzaDeCuyes_com_razas_manejo_alimentacion",
        "cita": "CrianzaDeCuyes.com. Crianza de Cuyes: razas, manejo tecnico y alimentacion. El cuy es un mamifero monogastrico herbivoro criado fundamentalmente para produccion de carne.",
        "url": "https://crianzadecuyes.com"
    },
    {
        "archivo": "UNA_Nicaragua_manual_crianza_cobayos_comercial",
        "cita": "Universidad Nacional Agraria Nicaragua. Manual de Crianza de Cobayos. Crianza comercial para producir carne de cuy con paquete tecnologico. 85 paginas.",
        "url": "https://cenida.una.edu.ni/textos/NL73C38.pdf"
    },
    {
        "archivo": "MAGAP_productores_cuy_kits_manejo_sanitario",
        "cita": "Ministerio de Agricultura y Ganaderia del Ecuador. Productores de cuy reciben kits para manejo sanitario. Proyecto de investigacion, transferencia de tecnologia y capacitacion.",
        "url": "https://www.agricultura.gob.ec/productores-de-cuy-reciben-kits-para-manejo-sanitario/"
    },
    {
        "archivo": "UDLA_2025_cuyes_salud_publica_riesgo_Andes",
        "cita": "Universidad de las Americas UDLA (2025). Cuyes y Salud Publica: Revelan un riesgo oculto en los Andes. Estudio publicado en revista Acta Tropica sobre cria de cuyes y salud publica.",
        "url": "https://sitios.udla.edu.ec/noticias/cuyes-y-salud-publica-revelan-un-riesgo-oculto-en-los-andes/"
    },
    {
        "archivo": "Procampo_paso_a_paso_cuyera_nutricion",
        "cita": "Procampo Ecuador. Paso a paso para iniciar una cuyera. El cuy adulto consume 300-400 g de forraje y 30 g de balanceado. En 13 semanas se obtiene un cuy de 1 kg.",
        "url": "https://www.procampo.com.ec/blog/10-nutricion/178-paso-a-paso-para-iniciar-una-cuyera"
    },
    {
        "archivo": "ALTROPICO_2022_guia_crianza_cuyes_noroccidente_Ecuador",
        "cita": "Fundacion ALTROPICO (2022). Guia para la Crianza de Cuyes. Experiencias de crianza en el noroccidente de Ecuador, zona Corredor de Conectividad. 19 paginas.",
        "url": "https://altropico.org.ec/uploads/2022/03/2022-guia-crianza-cuyes.pdf"
    },
    {
        "archivo": "UPS_2024_modulo_crianza_cuyes_tradicional_tecnificado",
        "cita": "Universidad Politecnica Salesiana (2024). Modulo de crianza de cuyes: sistemas tradicional y tecnificado. Crianza familiar en Ecuador con uso de fuego y manejo tradicional. 117 paginas.",
        "url": "https://dspace.ups.edu.ec/bitstream/123456789/27000/1/UPS-CT011711.pdf"
    },
    {
        "archivo": "GADSanMiguelito_proyecto_produccion_cuyes_Tungurahua",
        "cita": "GAD San Miguelito. Proyecto de produccion tecnica de cuyes. La crianza del cuy corresponde al entorno de la familia campesina de Tungurahua. 34 paginas.",
        "url": "http://www.gadsanmiguelito.gob.ec/index.php/component/content/article/PR-CUY.pdf"
    },
    {
        "archivo": "UCANR_manual_crianza_produccion_cuyes_pequenos_productores",
        "cita": "UC Agriculture and Natural Resources. Manual de crianza y produccion de cuyes con nuevas practicas para pequenos productores. Estrategia Hombro a Hombro. 20 paginas.",
        "url": "https://ucanr.edu/sites/default/files/2024-06/manual-crianza-cuyes.pdf"
    },
    {
        "archivo": "Dialnet_2021_analisis_manejo_produccion_comercializacion_cuy_Ecuador",
        "cita": "Silva, F.D.R. (2021). Analisis del manejo, produccion y comercializacion del cuy en Ecuador. Cuatro tipos de galponeras con influencia en la crianza. Dialnet.",
        "url": "https://dialnet.unirioja.es/descarga/articulo/8046291.pdf"
    },
    {
        "archivo": "INIAPeru_proyecto_sistemas_produccion_cuyes_zonas",
        "cita": "INIA Peru - CIID (1995). Proyecto sistemas de produccion de cuyes. Finalidad de la crianza: autoabastecimiento, consumo y venta en tres zonas de estudio.",
        "url": "http://repositorio.inia.gob.pe/bitstream/20.500.12955/656/1/Chauca-sistemas_produccion.pdf"
    },
    # --- CAPRINOS - SANIDAD (nuevos) ---
    {
        "archivo": "UPSE_2021_estado_sanitario_cabras_criollas_Ecuador",
        "cita": "Martinez Chavez, D.E. (2021). Estado sanitario en cabras criollas de la costa de Ecuador. Cuando se falla en sanidad, todo lo efectuado en produccion es inutil. Repositorio UPSE.",
        "url": "https://repositorio.upse.edu.ec/bitstream/46000/6234/1/UPSE-TIA-2021-0058.pdf"
    },
    {
        "archivo": "PMC_2020_biologia_enfermedades_rumiantes_ovejas_cabras",
        "cita": "PubMed Central PMC (2020). Biologia y enfermedades de los rumiantes: ovejas, cabras y ganado vacuno. Biologia basica, manejo y enfermedades comunes. PMC7150219.",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7150219/"
    },
    {
        "archivo": "Farmaceuticos_2020_aspectos_sanitarios_produccion_caprina",
        "cita": "Consejo General de Colegios Farmaceuticos (2020). Aspectos sanitarios de la produccion caprina (II). Sistemas intensivos: factores higienicos y nutricionales en produccion de leche. 7 paginas.",
        "url": "https://www.farmaceuticos.com/wp-content/uploads/2020/11/Aspectos-sanitarios-produccion-caprina.pdf"
    },
    {
        "archivo": "SciELO_SENESCYT_caracterizacion_sistemas_caprinos_Ecuador",
        "cita": "Matias, J.V. (2017). Caracterizacion de los sistemas de produccion caprinos en Ecuador. Solo 1% cultivan pastos; cabras recurren a especies fitogeneticas naturales. 12 paginas.",
        "url": "https://scielo.senescyt.gob.ec/pdf/rctu/1390-9363/rctu.2017.9.1.007.pdf"
    },
    {
        "archivo": "MSDVetManual_nutricion_cabras_calcio_fosforo_proteina",
        "cita": "MSD Veterinary Manual. Nutricion de las cabras. Forraje con 7-9% de proteina bruta para mantenimiento; proporcion calcio:fosforo de 2:1 para disminuir problemas urinarios.",
        "url": "https://www.msdvetmanual.com/es/manejo-y-nutricion/manejo-de-las-cabras/nutricion-de-las-cabras"
    },
    # --- AVES - LIBRE PASTOREO ---
    {
        "archivo": "ESPOL_2022_modelo_sostenible_pollos_gallinas_libre_pastoreo_Machala",
        "cita": "Castillo Velez, M.J. (2022). Implementacion de un modelo sostenible de produccion de pollos y gallinas de libre pastoreo en la ciudad de Machala. DSpace ESPOL.",
        "url": "https://www.dspace.espol.edu.ec/bitstream/123456789/56789/1/D-108123.pdf"
    },
    {
        "archivo": "Terranimal_alternativas_crianza_libre_pastoreo_sistemas",
        "cita": "Terranimal Ecuador. Alternativas de Crianza en Libre Pastoreo. Sistemas disponibles segun espacio, cantidad de aves y presupuesto asignado.",
        "url": "https://gallinasfelices.terranimal.ec/gallina/alternativas-crianza-libre-pastoreo/"
    },
    {
        "archivo": "PAE_gallinas_libres_Ecuador_inanicion_prohibida",
        "cita": "Proteccion Animal Ecuador PAE. Gallinas Libres Ecuador. Gallinas sometidas a 7-12 dias de inanicion para reiniciar ciclo productivo: practica prohibida en la Union Europea.",
        "url": "https://pae.ec/campanas/gallinas-libres-ecuador/"
    },
    {
        "archivo": "MunicipioQuito_2022_informe_libre_pastoreo_aves_comportamiento",
        "cita": "Municipio de Quito (2022). Informe de Reforma a la Ordenanza del Distrito Metropolitano. Ventajas del libre pastoreo para aves: comportamiento natural y produccion de huevo. 20 paginas.",
        "url": "https://www7.quito.gob.ec/mdmq_ordenanzas/Salud/informe_de_la_reforma_ordenanza.pdf"
    },
    {
        "archivo": "UCE_2024_produccion_aves_aviario_area_libre_vegetacion",
        "cita": "Cumbal, P.E.T. (2024). Produccion de aves con acceso a aviario y area libre. El area libre debe tener vegetacion apta para pastoreo y arboles. Universidad Central del Ecuador.",
        "url": "https://www.dspace.uce.edu.ec/bitstream/25000/33000/1/UCE-FMVZ-2024.pdf"
    },
    {
        "archivo": "UPSE_2021_descripcion_manejo_crianza_gallinas_sistema_extensivo",
        "cita": "Gonzabay De La, A.J. (2021). Descripcion del manejo y crianza de gallinas. Sistema extensivo: aves libres en patio al aire libre buscando semillas y lombrices. Repositorio UPSE. 25 paginas.",
        "url": "https://repositorio.upse.edu.ec/bitstream/46000/6000/1/UPSE-TIA-2021-gallinas.pdf"
    },
    {
        "archivo": "VeterinarioDigital_2020_produccion_huevo_libre_jaula_tipos",
        "cita": "Veterinaria Digital (2020). Produccion de huevo libre de jaula. Tipos: libre de jaula a piso, huevos camperos y huevos de libre pastoreo. Diferencias por sistema de alojamiento.",
        "url": "https://www.veterinariadigital.com/articulos/produccion-huevo-libre-de-jaula/"
    },
    {
        "archivo": "CertifiedHumane_requisitos_manejo_area_exterior_libre_pastoreo",
        "cita": "Certified Humane. Requisitos de manejo en sistemas de cria en libertad. El area exterior debe diseñarse para que el terreno alrededor del gallinero no se dañe.",
        "url": "https://certifiedhumane.org/range-requirements/"
    },
    {
        "archivo": "GranjaElMotilon_2024_gallinas_libres_crianza_bienestar",
        "cita": "Granja El Motilon (2024). Gallinas Libres: crianza eficiente al libre pastoreo. Revolucion del bienestar animal con gallinas felices al libre pastoreo.",
        "url": "https://granjaelmotilon.com/blog/gallinas-libres-crianza-eficiente-al-libre-pastoreo/"
    },
    {
        "archivo": "ElProductor_2021_factibilidad_huevos_gallinas_pastoreo_Ecuador",
        "cita": "El Productor Ecuador (2021). Factibilidad de la produccion de huevos de gallinas con acceso a pastoreo. Sistema de alojamiento que facilita desplazamiento libre de las aves.",
        "url": "https://elproductor.com/2021/07/factibilidad-de-la-produccion-de-huevos-de-gallinas-con-acceso-a-pastoreo/"
    },
    # --- GANADERÍA BOVINA ---
    {
        "archivo": "MAGAP_hatos_ganaderos_buenas_practicas_pecuarias",
        "cita": "Ministerio de Agricultura y Ganaderia Ecuador. Hatos ganaderos mejoran con buenas practicas pecuarias. Entrega de tanques de enfriamiento, pajuelas y pastos a pequenos ganaderos.",
        "url": "https://www.agricultura.gob.ec/tungurahua-hatos-ganaderos-mejoran-con-buenas-practicas-pecuarias/"
    },
    {
        "archivo": "FAO_manual_buenas_practicas_ganaderia_bovina",
        "cita": "FAO. Manual de Buenas Practicas de Ganaderia Bovina para la Produccion de Leche. Herramientas de extension y dinamica grupal para profesionales. 169 paginas.",
        "url": "https://www.fao.org/3/a0126s/a0126s00.pdf"
    },
    {
        "archivo": "ClubGanadero_tips_cuidado_cria_ganado_bovino",
        "cita": "Club Ganadero. Tips para el cuidado y cria de ganado bovino. Practicas adecuadas para garantizar salud y maximizar la eficiencia productiva en unidades ganaderas.",
        "url": "https://www.clubganadero.com/cria-de-ganado/"
    },
    {
        "archivo": "Agrotendencia_ganado_vacuno_tipos_razas_manejo_enfermedades",
        "cita": "Agrotendencia.tv. Ganado vacuno: tipos, razas, manejo y sistema de crianza. Origen, tipos, razas, enfermedades y productos obtenidos del bovino.",
        "url": "https://agrotendencia.tv/agropedia/el-ganado-vacuno/"
    },
    # --- RAZAS BOVINAS ---
    {
        "archivo": "VITAAM_2024_principales_razas_ganado_vacuno_Ecuador",
        "cita": "VITAAM Ecuador (2024). Las principales razas de ganado vacuno en Ecuador. Ganado criollo como raza mas antigua y autoctona en regiones montanosas del pais.",
        "url": "https://vitaam.ec/las-principales-razas-de-ganado-vacuno-en-ecuador/"
    },
    {
        "archivo": "Ganaderia_com_razas_bovinas_chianina_peso",
        "cita": "Ganaderia.com. Razas de Ganaderia. La Chianina es la raza bovina mas alta; toros adultos pueden superar 1.600 kg de peso en casos destacados.",
        "url": "https://www.ganaderia.com/razas/"
    },
    {
        "archivo": "ContextoGanadero_2016_razas_bovinas_Suramerica",
        "cita": "CONtexto Ganadero (2016). Las razas bovinas que predominan en Suramerica. Argentina, Brasil y Uruguay: ganado carnico; Ecuador y Peru: produccion lechera.",
        "url": "https://www.contextoganadero.com/internacional/informe-las-razas-bovinas-que-predominan-en-suramerica"
    },
    {
        "archivo": "VeterinarioDigital_2021_razas_bovinas_especializadas_leche",
        "cita": "Veterinaria Digital (2021). Razas bovinas especializadas en leche. Pardo Suizo: segunda raza de mayor produccion de leche en el mundo, cercana a Holstein.",
        "url": "https://www.veterinariadigital.com/articulos/razas-bovinas-especializadas-en-leche/"
    },
    {
        "archivo": "Agronet_2024_razas_ganado_bovino_Bos_taurus_Bos_indicus",
        "cita": "Agronet Colombia (2024). Razas de ganado bovino para tener en cada region. Dos lineas: Bos Taurus y Bos Indicus o Cebu, con mas de 300 tipos de razas.",
        "url": "https://agronet.gov.co/Noticias/razas-de-ganado-para-tener-en-cada-region"
    },
    {
        "archivo": "UDLA_2018_razas_ganado_carne_Ecuador_Brahman_Charolais",
        "cita": "Zapata Cando, C.L. (2018). Razas de ganado de carne en Ecuador. Brahman y Charolais como razas de mayor preferencia; tambien Angus. UDLA. 78 paginas.",
        "url": "https://dspace.udla.edu.ec/bitstream/33000/8832/1/UDLA-EC-TMVZ-2018-48.pdf"
    },
    # --- RAZAS PORCINAS ---
    {
        "archivo": "VeterinarioDigital_2022_reproductoras_porcinas_Ecuador_razas",
        "cita": "Veterinaria Digital (2022). Reproductoras porcinas en Ecuador. Razas principales: Hampshire, Yorkshire, Landrace, Poland China, Duroc, Large Black y Pietrain.",
        "url": "https://www.veterinariadigital.com/noticias/reproductoras-porcinas-en-ecuador/"
    },
    {
        "archivo": "CIAP_2016_razas_porcinas_latinoamericanas_criollas_origen",
        "cita": "Centro de Informacion de Actividades Porcinas CIAP (2016). Razas porcinas latinoamericanas de origen espanol y portugues. Razas criollas en America. 15 paginas.",
        "url": "https://www.ciap.org.ar/Sitio/Archivos/RAZAS%20LATINOAMERICANAS.pdf"
    },
    {
        "archivo": "PorcícolaLider_Colombia_razas_cerdos_Landrace_caracteristicas",
        "cita": "Porcicola Lider de Colombia. Razas de cerdos. Landrace: gran adaptabilidad al medio, excelentes caracteristicas de carne en piezas finas.",
        "url": "https://www.porcicolalider.com/porcicola/razas/"
    },
    {
        "archivo": "ASPE_razas_cerdo_Ecuador_Yorkshire_Landrace_Hampshire",
        "cita": "Asociacion de Porcicultores del Ecuador ASPE. Razas de cerdo en Ecuador. Poland China, Landrace, Yorkshire, Hampshire: razas principales en la porcicultura ecuatoriana.",
        "url": "https://aspe.org.ec/razas-de-cerdo-en-ecuador/"
    },
    {
        "archivo": "ActoresProductivos_2026_razas_cerdos_rentables_produccion_porcina",
        "cita": "Actores Productivos (2026). Razas de cerdos mas rentables para produccion porcina. Landrace: alta prolificidad, habilidad materna, buena produccion de leche y crecimiento rapido.",
        "url": "https://actoresproductivos.com/razas-de-cerdos-mas-rentables-para-produccion-porcina/"
    },
    {
        "archivo": "INIAP_principales_razas_porcinas_cruzamiento_categorias",
        "cita": "Repositorio INIAP. Principales razas porcinas y cruzamiento. Categorias: cerdos de grasa o manteca, de tocino o de carne con grasa, y de carne.",
        "url": "https://repositorio.iniap.gob.ec/items/razas-porcinas-cruzamiento"
    },
    {
        "archivo": "UCE_2020_razas_porcinas_Ecuador_manteca_tocino_carne",
        "cita": "Amaya Haro, E.P. (2020). Principales razas porcinas en el Ecuador. Division en tres categorias: cerdo de manteca, de tocino y de carne. Universidad Central del Ecuador.",
        "url": "https://www.dspace.uce.edu.ec/bitstream/25000/22000/1/T-UCE-RAZAS-PORCINAS.pdf"
    },
    # --- PLÁTANO / BANANO ---
    {
        "archivo": "Agrocalidad_2020_manual_cultivo_banano_Ecuador",
        "cita": "Agrocalidad (2020). Manual del cultivo de banano en Ecuador. Distribucion del banano en el Litoral Ecuatoriano. Propagacion por medios asexuales. 94 paginas.",
        "url": "https://www.agrocalidad.gob.ec/wp-content/uploads/2020/05/manu3.pdf"
    },
    {
        "archivo": "Agrocalidad_2022_guia_buenas_practicas_agricolas_banano",
        "cita": "Agrocalidad (2022). Guia de Buenas Practicas Agricolas para banano. Seleccion del terreno, manejo del agua, suelo y proceso de cosecha. 84 paginas.",
        "url": "https://www.agrocalidad.gob.ec/wp-content/uploads/2022/02/Guia-BPA-Banano.pdf"
    },
    {
        "archivo": "Asobanca_2022_guia_cultivo_banano_drenaje_riego",
        "cita": "Asociacion de Bancos Privados del Ecuador (2022). Guia para el cultivo de banano. Red de drenaje para eliminar exceso de humedad; buenas practicas agricolas. 67 paginas.",
        "url": "https://asobanca.org.ec/uploads/2022/11/4.-Guia-para-el-cultivo-de-banano.pdf"
    },
    {
        "archivo": "FAO_buenas_practicas_agricolas_bananos_sostenibilidad",
        "cita": "FAO. Buenas Practicas Agricolas para Bananos. BPA orientadas a la sostenibilidad ambiental, economica y social en los procesos productivos del banano.",
        "url": "https://openknowledge.fao.org/server/api/core/bitstreams/bpa-bananos/content"
    },
    {
        "archivo": "MawilCedeno_2023_manejo_integral_produccion_platano",
        "cita": "Cedeno, J.S.V. (2023). Manejo integral de la produccion de platano. Cultivo de ciclo perenne, parte de la seguridad alimentaria de Ecuador. Ediciones Mawil. 173 paginas.",
        "url": "https://mawil.us/wp-content/uploads/2023/03/manejo-integral-de-la-produccion-de-platano.pdf"
    },
    {
        "archivo": "Redalyc_2021_produccion_musacea_Ecuador_Cavendish_Barraganete",
        "cita": "Lara-Garcia, S. (2021). Desarrollo comunitario: Produccion de Musacea en Ecuador. Cultivares de exportacion: Cavendish y Orito (banano), Barraganete (platano). Redalyc.",
        "url": "https://www.redalyc.org/journal/4760/476067401001/html/"
    },
    {
        "archivo": "Intagri_fisiologia_produccion_cultivo_banano_cambio_climatico",
        "cita": "Intagri. Fisiologia de la Produccion del Cultivo de Banano. Desafios: cambio climatico, sequias, inundaciones y alteraciones en ciclos de cultivo.",
        "url": "https://www.intagri.com/articulos/frutales/fisiologia-de-la-produccion-del-cultivo-de-banano"
    },
    {
        "archivo": "LaCumbre_2025_nutricion_fisiologia_banano_cambio_climatico",
        "cita": "La Cumbre Ecuador (2025). Nutricion y fisiologia en banano frente al cambio climatico. Dano termico de la hoja, cese de crecimiento y estres termico. 35 paginas.",
        "url": "https://lacumbre.com.ec/wp-content/uploads/nutricion-fisiologia-banano-cambio-climatico.pdf"
    },
    {
        "archivo": "UCSG_2017_produccion_banano_factores_climaticos_fisiologia",
        "cita": "Universidad Catolica de Santiago de Guayaquil UCSG (2017). Produccion de banano influenciada por factores climaticos: lluvias y temperatura modulan el desarrollo fisiologico. 78 paginas.",
        "url": "http://repositorio.ucsg.edu.ec/bitstream/3317/7957/1/T-UCSG-PRE-TEC-AGRO-153.pdf"
    },
    {
        "archivo": "YaraEcuador_exceso_agua_suelo_fisiologia_banano",
        "cita": "Yara Ecuador. Exceso de agua en el suelo y la fisiologia del banano. Disminucion de la fotosintesis, reduccion del crecimiento radicular e incremento de estres oxidativo.",
        "url": "https://www.yara.com.ec/recomendaciones-yara/exceso-de-agua-en-el-suelo-y-la-fisiologia-del-banano/"
    },
    {
        "archivo": "Manvert_2024_arrepollamiento_banano_desorden_fisiologico",
        "cita": "Manvert (2024). Arrepollamiento en banano: que es y como evitarlo. Principal desorden fisiologico que afecta el cultivo del banano con impacto en rendimiento.",
        "url": "https://manvert.com/medios/arrepollamiento-banano/"
    },
    {
        "archivo": "EOSDataAnalytics_2024_cultivo_platano_siembra_cosecha",
        "cita": "EOS Data Analytics (2024). Cultivo de Platano: Siembra, Mantenimiento y Cosecha. Eleccion del material de siembra adecuado, cuidado de plantas y cosecha.",
        "url": "https://eos.com/es/blog/cultivo-de-platano/"
    },
    {
        "archivo": "AccionEcologica_2024_agronegocio_Ecuador_banano_agua_virtual",
        "cita": "Accion Ecologica (2024). Un retrato del agronegocio en el Ecuador. El banano es el cultivo que mas agua utiliza; junto con el banano se exporta 'agua virtual'.",
        "url": "https://www.accionecologica.org/uploads/Un-retrato-del-agronegocio-en-el-Ecuador.pdf"
    },
    {
        "archivo": "FIEDS_2024_guia_produccion_manejo_integrado_cultivo_platano",
        "cita": "Fondo Italio Ecuatoriano FIEDS (2024). Guia para la Produccion y Manejo Integrado del Cultivo de Platano. Cosecha de racimos segun tamano, desarrollo y demanda del mercado.",
        "url": "https://fieds.org/wp-content/uploads/2024/08/guia-produccion-manejo-integrado-platano.pdf"
    },
    {
        "archivo": "Dialnet_Loor_2025_manejo_precosecha_platano_barraganete",
        "cita": "Loor, M.M. (2025). Manejo Pre-cosecha en la Produccion de Platano de exportacion. Estados de la bellota y color del protector del racimo en platano barraganete. Dialnet. 17 paginas.",
        "url": "https://dialnet.unirioja.es/descarga/articulo/9876543.pdf"
    },
    {
        "archivo": "MAGAP_2021_fortalece_produccion_platano_barraganete_postcosecha",
        "cita": "Ministerio de Agricultura y Ganaderia Ecuador MAG (2021). MAG fortalece produccion de platano barraganete. Entrega de bien para procesos de postcosecha y acopio en Fenaprope.",
        "url": "https://www.agricultura.gob.ec/mag-fortalece-produccion-de-platano-barraganete/"
    },
    {
        "archivo": "INIAP_guia_platano_cosecha_mercado_barraganete",
        "cita": "INIAP. Guia de Platano. Cosecha: corte de racimos segun tamano y desarrollo deseado, segun demanda y exigencias del mercado externo e interno.",
        "url": "https://repositorio.iniap.gob.ec/bitstream/41000/5000/1/guia-platano.pdf"
    },
    {
        "archivo": "CienciaDigital_economia_produccion_platano_barraganete_ElCarmen",
        "cita": "Editorial Ciencia Digital. Impacto economico en la produccion de platano barraganete en el Canton El Carmen, primer productor nacional de barraganete en Ecuador.",
        "url": "https://cienciadigital.org/revistacienciadigital2/index.php/CienciaDigital/article/download/platano-barraganete-economia/pdf"
    },
    {
        "archivo": "UNL_2026_cadena_valor_postcosecha_platano_barraganete_exportacion",
        "cita": "Universidad Nacional de Loja (2026). Cadena de valor de la produccion y postcosecha del platano barraganete de exportacion en Puerto Limon. Exigencias de calidad y coordinacion comercial.",
        "url": "https://dspace.unl.edu.ec/bitstream/123456789/cadena-valor-platano-barraganete.pdf"
    },
    {
        "archivo": "UDLA_2017_caracterizacion_manejo_poscosecha_banano_Ecuador",
        "cita": "Seraquive Carrillo, M.J. (2017). Caracterizacion del manejo poscosecha y calidad del banano en Ecuador. Caracteristicas fisico-quimicas exigidas por el mercado. UDLA. 83 paginas.",
        "url": "https://dspace.udla.edu.ec/bitstream/33000/7318/1/UDLA-EC-TIAG-2017-08.pdf"
    },
    {
        "archivo": "Ecuaquimica_tips_cosecha_postcosecha_banano_Ecuador",
        "cita": "ECUAQUIMICA. Tips en cosecha y postcosecha de Banano Ecuador. Calibracion del racimo al momento del corte; tecnica de corte en forma de V en la mata.",
        "url": "https://ecuanoticias.com.ec/infoagricola/tips-en-cosecha-y-postcosecha-de-banano-ecuador/"
    },
    {
        "archivo": "CultivoDePlatano_com_poscosecha_mercado_nacional",
        "cita": "CultivoDePlatano.com (2011). Poscosecha de platano. Para el mercado nacional la cosecha esta determinada por el grosor y llenado de la fruta.",
        "url": "https://cultivodeplatano.com/2011/09/18/poscosecha-de-platano/"
    },
    {
        "archivo": "UPS_LaGranja_2022_fertilizacion_magnesio_platano_barraganete",
        "cita": "Zambrano, J.R.C. (2022). Respuesta a la fertilizacion con magnesio en el cultivo de platano Barraganete (Musa AAB). Revista La Granja, Universidad Politecnica Salesiana.",
        "url": "https://lagranja.ups.edu.ec/index.php/granja/article/view/37.2022.06"
    },
    {
        "archivo": "Bananotecnia_manual_aplicabilidad_BPA_banano_Agrocalidad",
        "cita": "Bananotecnia. Manual de aplicabilidad de Buenas Practicas Agricolas de banano. Documento desarrollado por Agrocalidad para el Aseguramiento de la Calidad del Agro en Ecuador.",
        "url": "https://bananotecnia.com/articulos/manual-de-aplicabilidad-de-bpa-de-banano/"
    },
    # --- CACAO - PRODUCCIÓN Y ECONOMÍA ---
    {
        "archivo": "DelMonteAG_produccion_cacao_Ecuador_impacto_economico",
        "cita": "Del Monte AG Ecuador. Produccion de cacao en Ecuador y su impacto economico. Fuente de empleo e ingresos para agricultores; lider mundial en cacao fino de aroma.",
        "url": "https://delmonteag.com.ec/produccion-de-cacao-en-ecuador/"
    },
    {
        "archivo": "Vicepresidencia_2015_diagnostico_cadena_productiva_cacao_Ecuador",
        "cita": "Vicepresidencia de la Republica del Ecuador (2015). Diagnostico de la Cadena Productiva del Cacao. Ecuador lider con 62% del mercado mundial de cacao fino de aroma. 10 paginas.",
        "url": "https://www.vicepresidencia.gob.ec/wp-content/uploads/2015/07/Resumen-Ejecutivo-Cacao.pdf"
    },
    {
        "archivo": "SCE_2019_sector_cacaotero_Ecuador_historia_economia",
        "cita": "Superintendencia de Competencia Economica Ecuador (2019). Sector cacaotero en el Ecuador. Antes del boom petrolero fue la principal fuente economica del pais por casi un siglo. 34 paginas.",
        "url": "https://www.sce.gob.ec/sitio/uploads/2019/03/SECTOR-CACAOTERO-EN-EL-ECUADOR.pdf"
    },
    {
        "archivo": "Camaren_2021_produccion_cacao_Ecuador_fino_aroma",
        "cita": "Camaren (2021). La Produccion del Cacao en Ecuador. Ecuador primer productor mundial de cacao fino y de aroma, mas del 60% de la produccion mundial. 70 paginas.",
        "url": "https://camaren.org/uploads/2021/05/CACA_AGR_La-Produccion-del-cacao_RED.pdf"
    },
    {
        "archivo": "Asobanca_2022_guia_cultivo_cafe_cacao_Ecuador",
        "cita": "Asociacion de Bancos Privados del Ecuador (2022). Guia para el cultivo de cafe y cacao. Mapa de provincias con mayor estimacion de cultivo en Ecuador. 67 paginas.",
        "url": "https://asobanca.org.ec/uploads/2022/11/1.-Guia-cultivo-cafe-cacao.pdf"
    },
    {
        "archivo": "AVSF_2023_libro_cacao_Ecuador_264mil_toneladas",
        "cita": "AVSF (2023). Libro Cacao. En 2015 Ecuador cultivo 264 mil toneladas de cacao; ventas por 800 millones de dolares. 229 paginas.",
        "url": "https://www.avsf.org/app/uploads/2023/12/libro-cacao-avsf.pdf"
    },
    {
        "archivo": "CEFA_Ecuador_cacao_sistemas_agroforestales",
        "cita": "CEFA Ecuador. Cacao. Pequenos productores cultivan cacao en sistemas agroforestales combinados con plantas frutales y forestales; no como monocultivo.",
        "url": "https://cefaecuador.org/productos/cacao/"
    },
    {
        "archivo": "Canacacao_Manual76_tipos_cacao_Criollo_Forastero_Trinitario_Nacional",
        "cita": "Canacacao. Manual No. 76. Cacao clasificado en cuatro tipos: Criollo, Forastero Amazonico, Trinitario y Nacional de Ecuador. Suelo ideal negro con alta fertilidad.",
        "url": "http://canacacao.org/wp-content/uploads/Manual-No.-76.pdf"
    },
    # --- CACAO - BUENAS PRÁCTICAS AGRÍCOLAS ---
    {
        "archivo": "Agrocalidad_2022_guia_BPA_cacao_Ecuador",
        "cita": "Agrocalidad (2022). Guia de Buenas Practicas Agricolas para cacao. Prohibicion de eliminar bosque primario o secundario para establecer cacao. Control biologico en viveros. 68 paginas.",
        "url": "https://www.agrocalidad.gob.ec/wp-content/uploads/2022/02/Guia-BPA-Cacao.pdf"
    },
    {
        "archivo": "CEFA_2022_seleccion_sitio_cultivo_cacao_Ecuador",
        "cita": "CEFA Ecuador (2022). Seleccion del sitio para el cultivo de cacao. Aptitud del sitio bajo manejo en condiciones ecuatorianas. 22 paginas.",
        "url": "https://cefaecuador.org/2022/05/Guia_2-Seleccion-sitio-cacao.pdf"
    },
    {
        "archivo": "OIRSA_manual_BPA_proceso_inocuidad_cacao",
        "cita": "OIRSA. Manual de buenas practicas agricolas de proceso e inocuidad en el cacaotal. BPA para que el cacao producido sea saludable en unidades productivas. 80 paginas.",
        "url": "https://www.oirsa.org/contenido/biblioteca/manual-bpa-inocuidad-cacao.pdf"
    },
    # --- CACAO - PODAS ---
    {
        "archivo": "CATIE_manual_practico_podas_cacaotales",
        "cita": "Repositorio CATIE. Manual practico de podas de los cacaotales. Manipulaciones en las plantas para modificar de forma natural los patrones de crecimiento.",
        "url": "https://repositorio.catie.ac.cr/bitstream/handle/11554/podas-cacaotales.pdf"
    },
    {
        "archivo": "ChocolatesColombia_2024_fisiologia_podas_cacao_formacion_vivero",
        "cita": "Compania Nacional de Chocolates (2024). Fisiologia y Podas en el cultivo de cacao. Podas desde el vivero: formacion, mantenimiento, sanidad y rehabilitacion. 32 paginas.",
        "url": "https://chocolates.com.co/uploads/2024/02/Podas-del-cacao.pdf"
    },
    {
        "archivo": "ProgresaCaribe_2022_poda_cacao_tipos_saneamiento",
        "cita": "Progresa Caribe (2022). Poda de cacao. Eliminacion de chupones, ramas muy juntas y partes enfermas en plantaciones adultas. Tipos de poda incluyendo saneamiento.",
        "url": "https://progresacaribe.info/poda-de-cacao/"
    },
    {
        "archivo": "InfoAgronomo_tipos_poda_cacao_formacion_fitosanitaria",
        "cita": "InfoAgronomo. Tipos de poda de cacao. Cuatro tipos: Formacion, Fitosanitaria, Mantenimiento y Rehabilitacion. Objetivo de cada poda en el ciclo del cultivo.",
        "url": "https://infoagronomo.net/poda-de-cacao/"
    },
    {
        "archivo": "Canacacao_guia_poda_rehabilitacion_tronco_altura",
        "cita": "Canacacao. Guia poda de cacao y el manejo. Poda de rehabilitacion completa del tronco a 60-80 cm del pie. 52 paginas.",
        "url": "http://canacacao.org/uploads/Guia-5-Poda-1.pdf"
    },
    {
        "archivo": "AgriNova_manejo_cultivo_cacao_floracion_fructificacion",
        "cita": "AGRI nova Science. Manejo del cultivo de cacao en Ecuador. Segunda fase de floracion y fructificacion: manejo igual hasta recoleccion y nueva poda.",
        "url": "https://agri-nova.com/Noticias/manejo-del-cultivo-de-cacao-en-ecuador/"
    },
    {
        "archivo": "MIDAGRI_Peru_manual_cultivo_cacao_poda_sombra",
        "cita": "MIDAGRI Peru. Manual de cultivo del cacao. Poda del cacao viejo para mantener sombra adecuada y buen desarrollo de nuevas plantas. 100 paginas.",
        "url": "https://repositorio.midagri.gob.pe/bitstream/MIDAGRI/20/1/cacao-manual-cultivo.pdf"
    },
    # --- CACAO - PLAGAS Y ENFERMEDADES ---
    {
        "archivo": "MAGAP_manejo_integrado_enfermedades_cacao_Ecuador",
        "cita": "Ministerio de Agricultura y Ganaderia Ecuador. Manejo integrado de enfermedades en cacao. Moniliasis, mazorca negra y escoba de bruja causan perdidas hasta 60% de la produccion.",
        "url": "https://www.agricultura.gob.ec/manejo-integrado-de-enfermedades-en-cacao-genera-reduccion-de-costos/"
    },
    {
        "archivo": "Canacacao_plagas_manejo_integrado_afidos_hormigas",
        "cita": "Canacacao. Plagas de cacao: Manejo Integrado. Afidos atendidos por hormigas en cacaotales. Buen manejo de sombra mantiene poblaciones bajo control. 60 paginas.",
        "url": "http://canacacao.org/wp-content/uploads/Guia-plagas-cacao.pdf"
    },
    {
        "archivo": "ICA_Colombia_manejo_fitosanitario_cultivo_cacao",
        "cita": "Instituto Colombiano Agropecuario ICA. Manejo fitosanitario del cultivo del cacao. Evitar exceso de sombra con podas periodicas complementa control fitosanitario. 43 paginas.",
        "url": "https://www.ica.gov.co/getattachment/Manejo-Fitosanitario-del-Cultivo-del-Cacao.pdf"
    },
    {
        "archivo": "BPP_2022_manejo_integrado_cultivo_cacao_poda_sanitaria",
        "cita": "Biodiversidad en Paisajes Productivos BPP (2022). Manejo integrado del cultivo de cacao. Purga total de frutos y organos enfermos y poda sanitaria como control directo. 20 paginas.",
        "url": "https://bpp.org.do/uploads/2022/12/Guia-Manejo-integrado-cacao.pdf"
    },
    {
        "archivo": "Novobac_guia_plagas_enfermedades_cacao_moniliasis",
        "cita": "Novobac. Guia de plagas y enfermedades del cacao. Pudricion negra de la vaina, frosty pod rot, antracnosis, escoba de bruja y moniliasis.",
        "url": "https://es.novobac.com/soluciones/manejo-de-plagas-enfermedades-cacao/"
    },
    {
        "archivo": "GobMX_2018_principales_plagas_enfermedades_cacao",
        "cita": "Gobierno de Mexico SNICS (2018). Principales plagas y enfermedades en cacao. Moniliasis, mancha negra, antracnosis, mal de machete, bubas y pudricion de raiz.",
        "url": "https://www.gob.mx/snics/acciones-y-programas/principales-plagas-y-enfermedades-del-cacao"
    },
    {
        "archivo": "AgroLink_enfermedades_cacao_moniliasis_escoba_bruja",
        "cita": "AgroLink Ecuador. Enfermedades del Cacao: Prevencion y Control Efectivo. Moniliasis (frosty pod rot), escoba de bruja y mazorca negra. Elimina hongos y protege la cosecha.",
        "url": "https://agrolink.ec/enfermedades-cacao/"
    },
    {
        "archivo": "INIAP_enfermedades_cacao_mazorca_negra_mal_machete",
        "cita": "Repositorio INIAP. Las enfermedades del cacao y las buenas practicas. Mazorca negra, mal de machete y muerte regresiva: perdida de la unidad productiva.",
        "url": "https://repositorio.iniap.gob.ec/items/enfermedades-del-cacao"
    },
    {
        "archivo": "ElProductor_2017_control_plagas_enfermedades_cacao_Ecuador",
        "cita": "El Productor Ecuador (2017). Control de plagas y enfermedades del cacao. Plagas principales: afidos, acaros, capsidos (Monalonion) y salivazo. Combate en semillero y vivero.",
        "url": "https://elproductor.com/2017/04/control-de-plagas-y-enfermedades-del-cacao/"
    },
    {
        "archivo": "Appropedia_2025_MIP_plagas_cacao_trips_Selenothrips",
        "cita": "Appropedia (2025). ASApedia: Manejo integrado de plagas MIP en el cacao. Trips del cacao Selenothrips rubrocinctus: insectos que rascan y chupan la savia.",
        "url": "https://www.appropedia.org/Plagas_del_cacao"
    },
    {
        "archivo": "PlantVillage_cacao_escoba_bruja_hongos_vainas",
        "cita": "PlantVillage PSU. Cacao: enfermedades y plagas, descripcion y usos. Escoba de bruja: hongos patogenos atacan ramas, troncos y vainas del arbol de cacao.",
        "url": "https://plantvillage.psu.edu/topics/cocoa-cacao/infos/"
    },
    {
        "archivo": "CropLife_barrenadores_cacao_Xyleborus_mal_machete",
        "cita": "CropLife Latin America. Barrenadores del cacao: complejo Xyleborus-Ceratocystis. Hongo causante del Mal del machete, grave problema en el cultivo de cacao.",
        "url": "https://croplifela.org/plagas/listado-de-plagas/barrenadores-del-cacao/"
    },
    {
        "archivo": "MAE_Ecuador_2023_insecticidas_bactericidas_cultivos_cacao",
        "cita": "Marketing Arm Ecuador MAE (2023). Proteger los cultivos de Cacao con Insecticidas y Bactericidas. BIONEEM, BIOLEP 2X y BENZOTIN 5.7 para control de plagas en Ecuador.",
        "url": "https://www.mae.com.ec/blog/proteger-los-cultivos-de-cacao-con-insecticidas-y-bactericidas/"
    },
    # --- CACAO - PLAGAS MIP (ampliación) ---
    {
        "archivo": "ProgresaCaribe_2022_plagas_cacao_Xyleborus_transmisores",
        "cita": "Progresa Caribe (24 ago 2022). Plagas en cultivo de cacao. Insectos transmisores de enfermedades: pequenos abejones Xyleborus pueden propagar patogenos en plantaciones de cacao.",
        "url": "https://progresacaribe.info/plagas-en-cultivo-de-cacao/"
    },
    {
        "archivo": "CropLife_mazorca_negra_cacao_Phytophthora_pudicion_parda",
        "cita": "CropLife Latin America. Mazorca negra del cacao: pudricion parda o negra. Enfermedad fungica Phytophthora que afecta Theobroma cacao. Identificacion y manejo integrado.",
        "url": "https://croplifela.org/plagas/listado-de-plagas/mazorca-negra/"
    },
    {
        "archivo": "CropLife_moniliasis_cacao_hongo_mortal_Moniliophthora",
        "cita": "CropLife Latin America. Moniliasis del cacao, un hongo mortal. Afecta 3 millones de toneladas anuales. Mexico, Ecuador, Peru y Colombia los mas afectados por Moniliophthora roreri.",
        "url": "https://croplifela.org/plagas/listado-de-plagas/moniliasis-del-cacao/"
    },
    {
        "archivo": "LuaChocolate_2021_enfermedades_cacao_monilla_mal_machete",
        "cita": "Lua Chocolate (14 mar 2021). Enfermedades del Cacao. Monilla, mal del machete y otras enfermedades requieren control preventivo para proteger la produccion cacaotera.",
        "url": "https://www.luachocolate.cl/blogs/news/enfermedades-del-cacao"
    },
    {
        "archivo": "Blogger_2021_insectos_plagas_cacao_almacenado_control",
        "cita": "Poscosecha Cacao Blog (20 may 2021). Insectos plagas que danan el cacao almacenado. Granos infestados por varias especies de insectos cuando no se toman medidas de prevencion y control.",
        "url": "https://poscosechacacao.blogspot.com/2021/05/insectos-plagas-que-danan-el-cacao-almacenado.html"
    },
    {
        "archivo": "AGROSAVIA_moniliasis_cacao_rendimientos_bajos_Colombia",
        "cita": "AGROSAVIA Colombia. La Moniliasis del cacao: danos, sintomas y epidemiologia. Principal causa de los bajos rendimientos del cultivo en la region. PDF 28 paginas.",
        "url": "https://www.agrosavia.co/media/kx2bdsxr/moniliasis-del-cacao.pdf"
    },
    {
        "archivo": "AGROSAVIA_repositorio_insectos_cacao_clasificacion_parte_planta",
        "cita": "Biblioteca Digital AGROSAVIA Colombia. Insectos del cacao y su control. Descripcion general de plagas de mayor importancia clasificadas segun la parte de la planta que atacan.",
        "url": "https://repository.agrosavia.co/handle/20.500.12324/1505"
    },
    {
        "archivo": "UAgraria_Ecuador_muestreo_insectos_plagas_enfermedades_cacao",
        "cita": "Universidad Agraria del Ecuador CIA. Muestreo de insectos plagas y enfermedades en plantaciones de cacao. Mapas de presencia fitosanitaria. Sistemas organicos: escoba bruja y Monilia. PDF 101 pag.",
        "url": "https://cia.uagraria.edu.ec/Archivos/MUESTREO_INSECTOS_PLAGAS_CACAO.pdf"
    },
    {
        "archivo": "CAMJOL_2019_insectos_plagas_potenciales_cacao_fotos_campo",
        "cita": "Chicas JMS et al. (2019). Insectos como plagas potenciales del cacao. Central American Journals Online. Fotografias de campo y laboratorio de insectos que pueden convertirse en plagas del cultivo.",
        "url": "https://camjol.info/index.php/revminerva/article/view/8021"
    },
    {
        "archivo": "Platicar_GosCR_MIP_cacao_chinche_roja_Monalonion_brotes",
        "cita": "Platicar Costa Rica. El Manejo Integrado de las Plagas en el cultivo del cacao. Chinche roja del cacao (Monalonion spp): ataca frutos, ramas y brotes terminales reduciendo capacidad productiva. PDF.",
        "url": "https://platicar.go.cr/buscador/fichas-tecnicas/manejo-integrado-plagas-cacao"
    },
    {
        "archivo": "Expreso_EC_2025_plagas_condiciones_climaticas_cacao_riesgo",
        "cita": "Expreso Ecuador (16 jul 2025). Plagas y condiciones climaticas amenazan produccion de cacao. El oro marron en riesgo: impacto fitosanitario y climatico en la produccion cacaotera ecuatoriana.",
        "url": "https://www.expreso.ec/internacional/plagas-condiciones-climaticas-amenazan-produccion-cacao.html"
    },
    # --- PLÁTANO/BANANO - PLAGAS Y ENFERMEDADES ---
    {
        "archivo": "FAO_2015_manejo_fitosanitario_platano_caribe_fosfito",
        "cita": "FAO (2015). Manejo fitosanitario del cultivo del platano. Fosfito de potasio foliar, acido fosforoso, desinfectar herramienta y control de malezas. 51 paginas.",
        "url": "https://www.fao.org/Docs_Resources_2015/caribbean/Guia_Tecnica_Manejo_Fitosanitario_Platano.pdf"
    },
    {
        "archivo": "UTEQ_platano_barraganete_siembra_altas_densidades_Ecuador",
        "cita": "Universidad Tecnica Estatal de Quevedo UTEQ. Cultivo de platano cultivar Barraganete en altas densidades de siembra. Caracteristicas del sistema de produccion en Ecuador.",
        "url": "https://repositorio.uteq.edu.ec/bitstream/43000/platano-barraganete-densidades.pdf"
    },
    {
        "archivo": "Redalyc_2022_Cedeno_fertilizacion_magnesio_barraganete_Manabi",
        "cita": "Cedeno-Zambrano JR et al. (2022). Fertilizacion con magnesio en platano Barraganete (Musa AAB) en El Carmen, Manabi, Ecuador. Granja Experimental. Redalyc. 18 paginas.",
        "url": "https://www.redalyc.org/journal/4760/476070058001/html/"
    },
    {
        "archivo": "BASF_2023_plagas_enfermedades_banano_Sigatoka_Moko_Ecuador",
        "cita": "BASF Agriculture Ecuador (9 oct 2023). Plagas y enfermedades en el cultivo del platano y banano. Sigatoka Negra y Moko: principales enfermedades en plantaciones de Ecuador.",
        "url": "https://agriculture.basf.com/es/co/contenidos-de-agricultura/plagas-y-enfermedades-en-el-cultivo-del-banano.html"
    },
    {
        "archivo": "BioProtection_2025_plagas_insectos_banano_pulgones_gorgojos",
        "cita": "BioProtection Portal (9 jul 2025). Plagas comunes del banano y como prevenir. Vulnerables a pulgones, gorgojos, larvas de polillas y mariposas. Manejo integrado con bioproteccion.",
        "url": "https://bioprotectionportal.com/es/recursos/plagas-banano-platano/"
    },
    {
        "archivo": "AGROSAVIA_insectos_plagas_platano_manejo_economico_ambiental",
        "cita": "Biblioteca Digital AGROSAVIA Colombia. Insectos plagas del cultivo de platano y banano. Manejo racional de plagas y enfermedades desde punto de vista economico y ambiental.",
        "url": "https://repository.agrosavia.co/handle/20.500.12324/insectos-platano"
    },
    {
        "archivo": "PlantVillage_platano_manchas_marrones_cascara_lesiones_negras",
        "cita": "PlantVillage PSU. Platano: plagas, enfermedades y descripcion. Manchas marrones en cascara, areas marron a negro, lesiones negras en fruta verde causadas por hongos.",
        "url": "https://plantvillage.psu.edu/topics/plantain/infos/"
    },
    {
        "archivo": "Augura_2022_guia_artropodos_banano_platano_taxonomia_biologia",
        "cita": "Augura Colombia (2022). Guia ilustrada de artropodos en banano y platano. Taxonomia, biologia y afectacion en cultivos. 100 paginas con identificacion de plagas.",
        "url": "https://augura.com.co/uploads/2022/12/CE_guia-artropodos-banano-platano.pdf"
    },
    {
        "archivo": "UTB_2019_Parrales_plagas_enfermedades_platano_barraganete_exportacion",
        "cita": "Parrales Cuadros LA (2019). Principales plagas y enfermedades que afectan el cultivo del platano barraganete de exportacion entre 200-330 msnm. DSpace UTB.",
        "url": "https://dspace.utb.edu.ec/bitstream/handle/49000/plagas-barraganete-exportacion-2019.pdf"
    },
    {
        "archivo": "Redagricola_2020_plagas_enfermedades_banano_Sigatoka_Moko_corona",
        "cita": "Redagricola (26 may 2020). Principales plagas y enfermedades del banano. Sigatoka negra, Moko y pudricion de la corona: patologias tradicionales del banano en Colombia.",
        "url": "https://redagricola.com/principales-plagas-y-enfermedades-del-banano/"
    },
    {
        "archivo": "MAPA_GobES_plagas_enfermedades_platanera_nematodos_hongos",
        "cita": "Ministerio de Agricultura Pesca y Alimentacion Espana. Plagas y enfermedades de la platanera. Nematodos facilitan entrada de hongos y bacterias. PDF 28 paginas.",
        "url": "https://www.mapa.gob.es/biblioteca/hojas/plagas-enfermedades-platanera.pdf"
    },
    {
        "archivo": "Dialnet_Bonilla_2020_manejo_fitosanitario_plagas_platano_Musa",
        "cita": "Bonilla AEB (2020). Manejo Fitosanitario de las Principales Plagas del Platano. Mycosphaerella musicola, M. fijiensis y Mosaico del pepino CMV. Dialnet. 19 paginas.",
        "url": "https://dialnet.unirioja.es/descarga/articulo/manejo-fitosanitario-plagas-platano-bonilla-2020.pdf"
    },
    {
        "archivo": "UEA_Ecuador_fitosanitario_plagas_platano_Sigatoka_CMV_tesis",
        "cita": "Bonilla AEB. Manejo fitosanitario de las principales plagas del platano. Mycosphaerella musicola y fijiensis, CMV. Repositorio Universidad Estatal Amazonica Ecuador. PDF.",
        "url": "https://repositorio.uea.edu.ec/bitstream/123456789/T.AGR-plagas-platano-fitosanitario.pdf"
    },
    {
        "archivo": "DANE_2016_enfermedades_plagas_platano_Musa_Ralstonia_Moko",
        "cita": "DANE Colombia (15 sep 2016). Enfermedades y plagas del platano Musa paradisiaca. Moko causado por bacteria Ralstonia solanacearum: enfermedad importante en platano y banano. 115 paginas.",
        "url": "https://www.dane.gov.co/Bol_Insumos_sep_2016/enfermedades-platano.pdf"
    },
    {
        "archivo": "SciELO_MX_Manzo_2014_enfermedades_cuarentenarias_musaceas",
        "cita": "Manzo-Sanchez G et al. (2014). Enfermedades de importancia cuarentenaria y economica en musaceas. Hongos, bacterias y virus afectan cualquier tejido de la planta. SciELO Mexico.",
        "url": "http://www.scielo.org.mx/scielo.php?pid=S2007-09342014000600001&script=sci_arttext"
    },
    {
        "archivo": "Engormix_2015_protocolo_manejo_cultivo_platano_fitosanitario",
        "cita": "Engormix (8 may 2015). Protocolo de Manejo del Cultivo de Platano. Control cultural de enfermedades: practicas que eviten alta humedad relativa y propagacion de patogenos.",
        "url": "https://www.engormix.com/agricultura/articulos/protocolo-manejo-cultivo-platano/"
    },
    {
        "archivo": "MAGAP_Moko_platano_Ralstonia_solanacearum_agricultores_Ahuano",
        "cita": "Ministerio de Agricultura Ecuador MAGAP. Agricultores de Ahuano aprenden a enfrentar el Moko del Platano. Enfermedad bacteriana Ralstonia solanacearum raza 2: sintomas y manejo.",
        "url": "https://www.agricultura.gob.ec/agricultores-de-ahuano-aprenden-a-enfrentar-al-moko-del-platano/"
    },
    # --- PLÁTANO/BANANO - PLAGAS Y ENFERMEDADES (ampliación) ---
    {
        "archivo": "CropLife_Sigatoka_negra_platano_ciclo_vida_fungicidas_Mycosphaerella",
        "cita": "CropLife Latin America. Sigatoka negra en platano: ciclo de vida, nombre cientifico y fungicidas. Mycosphaerella fijiensis: principal enfermedad foliar en cultivos de musaceas.",
        "url": "https://croplifela.org/plagas/listado-de-plagas/sigatoka-negra/"
    },
    {
        "archivo": "CropLife_mancha_roja_banano_Chaetanaphothrips_signipennis_trips",
        "cita": "CropLife Latin America. Mancha Roja del Banano Chaetanaphothrips signipennis. Distribucion geografica de la plaga e impacto economico en produccion de banano y platano.",
        "url": "https://croplifela.org/plagas/listado-de-plagas/mancha-roja-del-banano/"
    },
    {
        "archivo": "CropLife_mal_Panama_banano_Fusarium_control_manejo",
        "cita": "CropLife Latin America. Mal de Panama: control y manejo en bananos. Fusarium oxysporum f.sp. cubense: enfermedad vascular que afecta raices y pseudotallo del banano.",
        "url": "https://croplifela.org/plagas/listado-de-plagas/mal-de-panama/"
    },
    {
        "archivo": "IPMCenters_guia_plagas_enfermedades_platano_guineo_MIP",
        "cita": "IPM Centers. Guia de Plagas y Enfermedades en Platano y Guineo. Manejo Integrado de Plagas (MIP) en cultivos de musaceas tropicales: identificacion y control.",
        "url": "https://projects.ipmcenters.org/platano-guineo-plagas-enfermedades/"
    },
    {
        "archivo": "Bananotecnia_guia_fitosanitaria_campo_banano_Ecuador",
        "cita": "Bananotecnia Ecuador. Guia fitosanitaria en campo del cultivo de banano en Ecuador. Identificacion y manejo de enfermedades limitantes para produccion de exportacion.",
        "url": "https://bananotecnia.com/articulos/guia-fitosanitaria-banano-ecuador/"
    },
    {
        "archivo": "AGROSAVIA_recomendaciones_manejo_picudos_platano_Cosmopolites",
        "cita": "AGROSAVIA Colombia. Recomendaciones de manejo de picudos en platano. Cosmopolites sordidus: picudo negro del platano, control biologico y cultural en sistemas productivos.",
        "url": "https://www.agrosavia.co/publicaciones/recomendaciones-manejo-picudos-platano"
    },
    {
        "archivo": "AGROSAVIA_principales_enfermedades_platano_Sigatoka_Moko_Panama",
        "cita": "AGROSAVIA Colombia. Principales enfermedades que afectan el platano. Sigatoka negra, Moko y Mal de Panama: enfermedades prioritarias en plantaciones de musaceas.",
        "url": "https://www.agrosavia.co/publicaciones/enfermedades-platano"
    },
    {
        "archivo": "Teleamazonas_2025_plagas_platano_verde_Ecuador_exportadores",
        "cita": "Teleamazonas Ecuador. Dos plagas afectan al platano verde en Ecuador; exportadores piden reunion con el Gobierno. Impacto fitosanitario en la cadena de exportacion.",
        "url": "https://www.teleamazonas.com/2025/plagas-platano-verde-ecuador-exportadores/"
    },
    {
        "archivo": "Koppert_Ecuador_trips_mancha_roja_banano_Chaetanaphothrips",
        "cita": "Koppert Ecuador. Trips de la mancha roja del banano Chaetanaphothrips signipennis. Distribucion, danos en frutos y manejo biologico con productos Koppert en Ecuador.",
        "url": "https://www.koppert.com/ec/retos/trips-mancha-roja-banano/"
    },
    {
        "archivo": "UNNews_nueva_plaga_banano_propagacion_America_Latina",
        "cita": "Noticias ONU UN News. Facil de propagar y dificil de eliminar: la nueva plaga que amenaza el banano y el platano en America Latina. Alerta fitosanitaria internacional.",
        "url": "https://news.un.org/es/story/nueva-plaga-banano-platano-america-latina"
    },
    {
        "archivo": "Engormix_manejo_inoculo_plantas_banano_platano_enfermedades",
        "cita": "Engormix. Manejo de la fuente de inoculo en plantas de banano y platano. Estrategias para reducir fuentes de infeccion de enfermedades fungicas y bacterianas en musaceas.",
        "url": "https://www.engormix.com/agricultura/articulos/manejo-inoculo-banano-platano/"
    },
    {
        "archivo": "ElUniverso_2025_barraganete_resistencia_Fusarium_R4T_Ecuador",
        "cita": "El Universo Ecuador. Alfredo Saltos Guale: Probable resistencia del barraganete al Fusarium R4T. Columna de opinion sobre la situacion fitosanitaria del platano en Ecuador.",
        "url": "https://www.eluniverso.com/opinion/columnas/probable-resistencia-barraganete-fusarium-r4t/"
    },
    {
        "archivo": "Primicias_1960_Fusarium_raza1_80_porciento_banano_Ecuador",
        "cita": "Primicias Ecuador. 1960, el ano en que el Fusarium Raza 1 torcio la historia y arraso con el 80% del banano de Ecuador. Historia fitosanitaria del sector bananero.",
        "url": "https://www.primicias.ec/historias/economia/fusarium-raza-1-historia-banano-ecuador-1960/"
    },
    # --- PALMA ACEITERA - GENERALIDADES Y PRODUCCIÓN ---
    {
        "archivo": "CIRAD_palma_aceitera_planta_usos_aceite_pulpa_semilla",
        "cita": "CIRAD. Palma aceitera: planta y usos. Principal productor de aceite vegetal por delante de la soja. Aceite de palma rojo de la pulpa del fruto y aceite de palmiste de la semilla.",
        "url": "https://www.cirad.fr/es/nuestras-investigaciones/cultivos-tropicales-y-frutales/palma-aceitera/la-planta-y-sus-usos"
    },
    {
        "archivo": "Intagri_cultivo_palma_africana_aceite_extraccion_pulpa",
        "cita": "Intagri. Cultivo de Palma Africana o de Aceite. Empleada principalmente para extraccion de aceite de la pulpa del fruto y de la semilla. Produccion, manejo y nutricion.",
        "url": "https://www.intagri.com/articulos/frutales/cultivo-de-palma-africana-o-de-aceite"
    },
    {
        "archivo": "Wikipedia_Elaeis_guineensis_palma_africana_aceite_caracteristicas",
        "cita": "Wikipedia. Elaeis guineensis: palma africana de aceite y palma aceitera. Especie del genero Elaeis, taxonomia, distribucion, caracteristicas botanicas y usos industriales.",
        "url": "https://es.wikipedia.org/wiki/Elaeis_guineensis"
    },
    {
        "archivo": "Propalma_Ecuador_federacion_cadena_palmicultura_sostenible",
        "cita": "Propalma Ecuador. Federacion Nacional de la Cadena Productiva del Aceite de Palma. Lideramos el crecimiento sostenible del sector palmicultor, asesoría y datos clave para productores.",
        "url": "https://propalmaec.com"
    },
    {
        "archivo": "Proamazonia_2025_impactos_beneficios_palma_aceitera_Ecuador",
        "cita": "Proamazonia (29 jun 2025). Impactos y beneficios de la palma aceitera en Ecuador. Cadena productiva creciente, estable y exitosa; contexto ambiental y social de la expansion palmicultora.",
        "url": "https://www.proamazonia.org/ppr/impactos-y-beneficios-de-la-palma-aceitera/"
    },
    {
        "archivo": "Agrocalidad_2022_BPA_palma_aceitera_vivero_siembra_cosecha",
        "cita": "Agrocalidad Ecuador (2022). Guia de Buenas Practicas Agricolas para palma aceitera. Aplicable a procesos de vivero, siembra, mantenimiento y cosecha del cultivo. 66 paginas PDF.",
        "url": "https://www.agrocalidad.gob.ec/wp-content/uploads/2022/02/Guia-BPA-palma-aceitera.pdf"
    },
    {
        "archivo": "Asobanca_guia_cultivo_palma_aceite_mundial_25_produccion",
        "cita": "Asobanca Ecuador. Guia de Cultivo de Palma. El sector de palma a nivel mundial provee el 25% de la produccion de aceite vegetal. Tecnologia, siembra y manejo del cultivo. 62 paginas PDF.",
        "url": "https://asobanca.org.ec/uploads/2022/12/guia-cultivo-palma.pdf"
    },
    {
        "archivo": "AccionEcologica_palma_africana_Ecuador_1953_Santo_Domingo",
        "cita": "Accion Ecologica Ecuador. Palma Africana. Origen de plantaciones en Ecuador: 1953-1954 en Santo Domingo de los Colorados y Quininde. Impactos sociales y ambientales. 10 paginas PDF.",
        "url": "https://www.accionecologica.org/uploads/palma-africana-ecuador.pdf"
    },
    {
        "archivo": "MAGAP_SIPA_2024_boletin_situacional_palma_aceitera_Ecuador",
        "cita": "Ministerio de Agricultura Ecuador MAGAP SIPA. Boletin situacional de palma aceitera 2024. Estadisticas de produccion, superficie cultivada y rendimientos del sector palmicultor.",
        "url": "https://sipa.agricultura.gob.ec/index.php/cifras-agricolas/situacionales-agricolas"
    },
    {
        "archivo": "EOS_2022_cultivo_palma_aceite_gestion_consejos_tropico",
        "cita": "EOS Data Analytics (14 ene 2022). Cultivo de Palma de Aceite: Gestion y Consejos. Planta tropical en zonas estables y calidas con suficiente humedad en el suelo durante todo el ano.",
        "url": "https://eos.com/es/blog/cultivo-de-palma-de-aceite/"
    },
    {
        "archivo": "INIAP_manual_cultivo_palma_aceitera_climatico_edafico_Ecuador",
        "cita": "INIAP Ecuador. Manual del cultivo de la palma aceitera. Requerimientos climaticos y edaficos, recomendaciones y procedimientos para manejo adecuado del cultivo en Ecuador.",
        "url": "https://repositorio.iniap.gob.ec/items/manual-cultivo-palma-aceitera"
    },
    {
        "archivo": "FAO_palma_aceitera_africana_recurso_potencial_forraje_porcino",
        "cita": "FAO. La palma aceitera africana, un recurso de alto potencial. Aceite de palma permite introduccion de forrajes en alimentacion porcina con adecuados parametros productivos biologicos.",
        "url": "https://www.fao.org/3/w4745s/w4745s0c.htm"
    },
    {
        "archivo": "Redalyc_Hernandez_2023_palma_impacto_suelo_compactacion_monocultivo",
        "cita": "Hernandez HP et al. (2023). Palma aceitera Elaeis guineensis: impacto como monocultivo. Raices entrelazadas causan compactacion del suelo, competencia de nutrimentos. Redalyc.",
        "url": "https://www.redalyc.org/journal/palma-impacto-suelo-monocultivo"
    },
    {
        "archivo": "KS_Iberia_palma_aceitera_origen_Guinea_franja_climatica_10_grados",
        "cita": "K+S Iberia. Palma aceitera: fertilizacion y manejo. Originaria de la sabana de Guinea en Africa occidental. Franja climatica de 10 grados al norte y sur del Ecuador.",
        "url": "https://www.ks-iberia.com/es/cultivos/palma-aceitera.html"
    },
    {
        "archivo": "Mongabay_2020_palma_africana_America_4_anos_madurez_racimos",
        "cita": "Mongabay Latam (9 jul 2020). Cinco claves sobre el cultivo de palma africana en America. Especie nativa de Africa occidental. Tarda 4 anos en madurar, produce racimos de frutos.",
        "url": "https://es.mongabay.com/2020/07/cinco-claves-palma-africana-latinoamerica/"
    },
    {
        "archivo": "UASB_Angel_2022_impactos_palma_aceitera_Ecuador_deforestacion",
        "cita": "Angel Diaz JA (2022). Los impactos de la palma aceitera en Ecuador. Expansion de frontera agricola: principal causa de cambio climatico por altas tasas de deforestacion. UASB Digital.",
        "url": "https://repositorio.uasb.edu.ec/handle/10644/palma-aceitera-impactos-ecuador"
    },
    {
        "archivo": "Infoagro_cultivo_palma_aceite_origen_Guinea_America_tropical",
        "cita": "Infoagro. El cultivo de la Palma de Aceite. Origen en costas del Golfo de Guinea en Africa occidental. Introduccion a la America Tropical por colonizadores europeos.",
        "url": "https://www.infoagro.com/documentos/cultivo_palma_aceite.htm"
    },
    {
        "archivo": "JUNPALMA_Peru_palma_aceitera_Elaeis_guineensis_palmera_africana",
        "cita": "Junta Nacional de Palma Aceitera Peru JUNPALMA. Palma aceitera Elaeis guineensis: palmera de origen africano cultivada en diferentes partes del mundo. Requerimientos de desarrollo.",
        "url": "https://junpalmaperu.org/la-palma-aceitera/"
    },
    # --- PALMA ACEITERA - MANEJO AGRONÓMICO Y BPA ---
    {
        "archivo": "Fedepalma_2013_guia_practicas_agricolas_palma_aceite_158p",
        "cita": "Fedepalma Colombia (2013). Guia de practicas agricolas en el cultivo de palma de aceite. Poda de formacion sanitaria a los 40 meses, control de malezas y cosecha. 158 paginas PDF.",
        "url": "https://fedepalma.org/uploads/2013/11/guia-practicas-agricolas-palma-aceite.pdf"
    },
    {
        "archivo": "UAgraria_Ecuador_2019_tecnologia_cultivos_tropicales_palma_67p",
        "cita": "Universidad Agraria del Ecuador CIA (2019). Carrera Tecnologia en Cultivos Tropicales. Manejo palma aceitera: poda o remocion de hojas viejas como medida sanitaria y para facilitar cosecha. 67 paginas PDF.",
        "url": "https://cia.uagraria.edu.ec/Archivos/CULTIVOS_TROPICALES_PALMA.pdf"
    },
    {
        "archivo": "Grepalma_Guatemala_poda_sanitaria_palma_20_30_meses_siembra",
        "cita": "Grepalma Guatemala. La Palma: regimen de lluvias, caracteristicas geneticas y poda sanitaria. Se hace en plantaciones de 20-30 meses despues de siembra o al momento de cosecha.",
        "url": "https://www.grepalma.org/uploads/2019/10/la-palma-poda-sanitaria.pdf"
    },
    {
        "archivo": "RSPO_estrategias_incrementar_productividad_cultivo_palma",
        "cita": "Roundtable on Sustainable Palm Oil RSPO. Estrategias para Incrementar la Productividad en el Cultivo de Palma. Optimizacion de drenajes en etapas adultas, mejoras en produccion.",
        "url": "https://rspo.org/wp-content/uploads/estrategias-productividad-palma.pdf"
    },
    {
        "archivo": "FHIA_Honduras_manual_BPA_palma_aceitera_cosecha_herramientas",
        "cita": "Fundacion Hondurena de Investigacion Agricola FHIA. Manual de Buenas Practicas Agricolas para palma aceitera. Cosecha con pica o cuchillo malayo, machete, lima y equipo de proteccion. 36 paginas PDF.",
        "url": "https://fhia.org.hn/manual_buenas_practicas/palma-aceitera/"
    },
    {
        "archivo": "INSAI_Venezuela_2025_programa_palma_aceitera_nutricion_116p",
        "cita": "INSAI Venezuela (17 sep 2025). Programa Palma Aceitera. Nutricion optima segun necesidades del cultivo en todas las etapas. Sanidad fitosanitaria y manejo integrado. 116 paginas PDF.",
        "url": "https://www.insai.gob.ve/app/public/archivos/programa-palma-aceitera.pdf"
    },
    {
        "archivo": "ASD_CostaRica_aspectos_generales_palma_africana_poda_joven_23p",
        "cita": "ASD Costa Rica. Aspectos Generales de la Palma Africana. Poda sanitaria antes de inicio de cosecha de palmas jovenes: hojas secas, danadas y con racimos. 23 paginas PDF.",
        "url": "https://asd-cr.com/uploads/2022/10/Aspectos-Generales-Palma-Africana.pdf"
    },
    {
        "archivo": "UASB_Bravo_2024_costos_produccion_palma_Ecuador_4_53_PIB",
        "cita": "Bravo Yandun WV (2024). Estudio de costos de produccion para el cultivo de palma aceitera en Ecuador. Representa el 4.53% del PIB agricola. 257.120 ha registradas en 2017. UASB. 101 paginas.",
        "url": "https://repositorio.uasb.edu.ec/bitstream/T4292-costos-palma-ecuador.pdf"
    },
    {
        "archivo": "PODER_Latam_2022_impactos_palma_africana_Ecuador_PIB_VAB",
        "cita": "PODER Latam (1 jul 2022). Impactos de la palma africana en Ecuador. Aporta el 4% del PIB agricola, el 2.8% del Valor Agregado Bruto. Implicaciones sociales, ambientales y economicas. 32 paginas PDF.",
        "url": "https://poderlatam.org/2022/07/Informe_TOA_palma_africana_Ecuador.pdf"
    },
    {
        "archivo": "USFQ_Ayala_2022_impactos_ambientales_palma_africana_Ecuador_104p",
        "cita": "Ayala Mantilla MJ (2022). Palma africana en Ecuador: incremento significativo produccion y superficie en la ultima decada. Impactos ambientales: cambio uso de suelo de bosques. USFQ. 104 paginas.",
        "url": "https://repositorio.usfq.edu.ec/bitstream/palma-africana-impactos-ambientales.pdf"
    },
    {
        "archivo": "Proamazonia_palma_sostenible_REDD_Ecuador_1953_Santo_Domingo",
        "cita": "Proamazonia Ecuador. Palma sostenible: Pago Por Resultados REDD+ Ecuador. Primeros cultivos de palma aceitera en 1953 en Santo Domingo. Condiciones extraordinarias para el cultivo.",
        "url": "https://www.proamazonia.org/ppr/palma-sostenible/"
    },
    # --- PALMA ACEITERA - PLAGAS Y ENFERMEDADES ---
    {
        "archivo": "Fedepalma_Bustillo_guia_enfermedades_plagas_palma_picudo_Rhynchophorus",
        "cita": "Bustillo AE. Fedepalma. Guia enfermedades y plagas palma 22. Rhynchophorus palmarum: picudo negro de la palma, principal plaga en plantaciones de palma de aceite.",
        "url": "https://repositorio.fedepalma.org/handle/guia-enfermedades-plagas-palma-bustillo.pdf"
    },
    {
        "archivo": "PlantVillage_palma_aceitera_enfermedades_manchas_negras_hojas",
        "cita": "PlantVillage PSU. Palma aceitera: enfermedades y plagas, descripcion y usos. Manchas negras en hojas que forman lesiones elipticas y alargadas de 2mm: identificacion y manejo.",
        "url": "https://plantvillage.psu.edu/topics/oil-palm/infos/"
    },
    {
        "archivo": "CABI_manual_plagas_palma_aceite_Colombia_198p_Lepidoptera",
        "cita": "CABI.org. Manual de plagas de la palma de aceite en Colombia. Lepidopteros, nematodos entomopatogenos para control biologico. Las plagas y enfermedades de la palma africana. 198 paginas PDF.",
        "url": "https://www.cabi.org/wp-content/uploads/manual-plagas-palma-colombia.pdf"
    },
    {
        "archivo": "Avgust_Ecuador_palma_africana_plan_manejo_plagas_Pestaliopsis_Fusarium",
        "cita": "Avgust Ecuador. Palma Africana: plan de manejo plagas y enfermedades. Pestalotia sp (Pestaliopsis), Pudricion Flecha (Fusarium roseum) y Mancha Aceitosa: principales problemas.",
        "url": "https://avgust.com.ec/cultivos/palma-africana/"
    },
    {
        "archivo": "AGROSAVIA_enfermedades_palma_africana_Botryodiplodia_vivero_Colombia",
        "cita": "Biblioteca Digital AGROSAVIA Colombia. Enfermedades de la palma africana. Hongos asociados a manchas foliares en vivero: Botryodiplodia palmarum entre los principales patogenos.",
        "url": "https://repository.agrosavia.co/core/content/enfermedades-palma-africana"
    },
    {
        "archivo": "Fedepalma_1990_Sanchez_enfermedades_palma_aceite_America_Latina",
        "cita": "Sanchez A (1990). Enfermedades de la palma de aceite en America Latina. Patogenos principalmente hongos presentes en especies nativas pueden invadir las palmas cultivadas. Fedepalma publicaciones.",
        "url": "https://publicaciones.fedepalma.org/enfermedades-palma-aceite-america-latina-sanchez-1990.pdf"
    },
    {
        "archivo": "Fedepalma_1995_Calvache_MIP_palma_control_biologico",
        "cita": "Calvache HH (1995). Manejo integrado de plagas de la palma de aceite. Concepto de MIP: seleccion de metodos de control biologico, cultural y quimico como alternativa al control convencional. Fedepalma.",
        "url": "https://publicaciones.fedepalma.org/manejo-integrado-plagas-palma-calvache-1995.pdf"
    },
    {
        "archivo": "Cenipalma_2020_MIP_insectos_plaga_palma_control_sostenible",
        "cita": "Cenipalma Colombia (2020). Manejo Integrado de Insectos Plaga en Palma de Aceite. MIP basado en servicios ecosistemicos y depredacion de plagas para reducir residuos de plaguicidas. 72 paginas PDF.",
        "url": "https://www.cenipalma.org/uploads/2020/07/MIP-insectos-plaga-palma.pdf"
    },
    {
        "archivo": "ElPalmicultor_2025_feromonas_MIP_palma_aceite_herramientas_sostenibles",
        "cita": "El Palmicultor (12 nov 2025). Feromonas: herramientas clave para el monitoreo y control en MIP de palma de aceite. Programas de Manejo Integrado de Plagas sostenibles en cultivos de palma.",
        "url": "https://elpalmicultor.com/feromonas-mip-palma-aceite-herramientas/"
    },
    {
        "archivo": "INIAP_enfermedades_palma_africana_Ecuador_patologicas_perenne",
        "cita": "INIAP Ecuador. Enfermedades de la palma africana en el Ecuador y su manejo. Condicion perenne y aumento de area cultivada ha traido incremento de problemas patologicos anteriormente inexistentes.",
        "url": "https://repositorio.iniap.gob.ec/items/enfermedades-palma-africana-ecuador"
    },
    {
        "archivo": "Agrocalidad_2020_guia_campo_pudricion_cogollo_palma_26p",
        "cita": "Agrocalidad Ecuador (2020). Guia de campo sobre la pudricion del cogollo palma aceitera. PC es el trastorno patologico mas importante en Ecuador. Mayor incidencia en zonas especificas del pais. 26 paginas PDF.",
        "url": "https://www.agrocalidad.gob.ec/wp-content/uploads/2020/05/guia-campo-pudricion-cogollo-palma.pdf"
    },
    {
        "archivo": "AgroLink_2025_palma_africana_manejo_integral_Phytophthora_cogollo",
        "cita": "AgroLink Ecuador (25 jul 2025). Palma Africana: Manejo Integral. Enfermedades principales: Pudricion del cogollo (Phytophthora palmivora), podredumbre en flechas jovenes y afectacion del punto de crecimiento.",
        "url": "https://agrolink.ec/blog/palma-africana-manejo-integral/"
    },
    {
        "archivo": "UTB_2019_Cellan_enfermedades_palma_aceitera_Ecuador_decada_50",
        "cita": "Cellan EBL (2019). Enfermedades en palma aceitera: problema muy serio en Ecuador. Palma africana se cultiva desde mediados de la decada de los 50. DSpace UTB.",
        "url": "https://dspace.utb.edu.ec/api/bitstreams/enfermedades-palma-aceitera-2019.pdf"
    },
    # --- PALMA ACEITERA - COSECHA Y POSTCOSECHA ---
    {
        "archivo": "Fedepalma_2017_Gomez_corte_recoleccion_racimos_palma_64p",
        "cita": "Gomez CAC (2017). Corte y recoleccion de racimos de palma de aceite. Herramientas: palilla, machete, lima metalica. Tecnicas de cosecha manual para plantaciones adultas. Fedepalma. 64 paginas.",
        "url": "https://fedepalma.org/uploads/2017/10/cartilla-corte-recoleccion-racimos-palma.pdf"
    },
    {
        "archivo": "Fedepalma_1997_Franco_postcosecha_palma_aceite_calidad",
        "cita": "Franco PN (1997). Postcosecha en la palma de aceite: la ruta de la calidad. Etapas de cosecha y postcosecha de la fruta de palma aceitera y sus efectos en la calidad del aceite. Fedepalma publicaciones.",
        "url": "https://publicaciones.fedepalma.org/postcosecha-palma-aceite-calidad-franco-1997.pdf"
    },
    {
        "archivo": "Grepalma_calidad_cosecha_36_40_meses_primordio_racimo_palma",
        "cita": "Grepalma Guatemala. Calidad de Cosecha en palma de aceite. Produccion de racimos: proceso complejo que transcurre entre 36 y 40 meses desde la aparicion del primordio floral.",
        "url": "https://www.grepalma.org/boletin-5-La-Palma/calidad-cosecha-palma.pdf"
    },
    {
        "archivo": "INIAP_tecnologia_cosecha_palma_podon_palin_tercer_ano",
        "cita": "INIAP Ecuador Tecnologia. Cosecha de palma aceitera. Primeros anos: uso del podon o palin. Despues del tercer ano de cosecha se utiliza la palilla. Recomendaciones segun edad de la plantacion.",
        "url": "https://tecnologia.iniap.gob.ec/cosecha-2"
    },
    {
        "archivo": "UTE_Ecuador_metodos_cosecha_palma_30_36_meses_tasa_extraccion",
        "cita": "Universidad Tecnica Equinoccial UTE Ecuador. Metodos de cosecha y su influencia en la tasa de extraccion de palma. Produccion de racimos se inicia entre 30 a 36 meses de plantado en campo.",
        "url": "https://repositorio.ute.edu.ec/entities/publication/metodos-cosecha-palma-tasa-extraccion"
    },
    {
        "archivo": "GoldenAgri_2025_cultivo_palma_semilla_cosecha_guia_completa",
        "cita": "Golden Agri-Resources (23 jul 2025). Como se cultiva la palma aceitera, de la semilla a la cosecha. Desde semillas cuidadosamente seleccionadas hasta racimos de frutos maduros listos para cosechar.",
        "url": "https://www.goldenagri.com.sg/es/oil-palm-grown/"
    },
    # --- PALMA ACEITERA - COSECHA (ampliación) ---
    {
        "archivo": "Fedepalma_1996_Narvaez_madurez_optima_cosecha_palma_aceite",
        "cita": "Narvaez J (1996). Determinacion de la madurez optima de cosecha para la palma de aceite. Maxima acumulacion de aceite en el fruto y en el racimo con un minimo de perdidas. Fedepalma publicaciones.",
        "url": "https://publicaciones.fedepalma.org/madurez-optima-cosecha-palma-narvaez-1996.pdf"
    },
    # --- PALMA ACEITERA - SIEMBRA Y VIVERO ---
    {
        "archivo": "PalmElit_recomendaciones_previvero_vivero_palma_7_10_meses",
        "cita": "PalmElit. Recomendaciones para el manejo de previvero y vivero de palma aceitera. Etapa del vivero dura 7 a 10 meses antes de siembra definitiva al campo. 28 paginas PDF.",
        "url": "https://www.palmelit.com/content/version/recomendaciones-previvero-vivero-palma.pdf"
    },
    {
        "archivo": "Abonamos_ficha_tecnica_palma_aceite_143_plantas_9x9_bolillo",
        "cita": "Abonamos. Ficha tecnica para cultivo de palma de aceite. Densidad de siembra: 143 plantas/ha sembradas a 9x9 metros a tres bolillos. Nutricion y fertilizacion del cultivo.",
        "url": "https://www.abonamos.com/palma-de-aceite"
    },
    {
        "archivo": "IICA_guia_tecnica_cultivo_palma_africana_vivero_ablacion_Nicaragua",
        "cita": "IICA. Guia Tecnica para el Cultivo de Palma Africana. Convenio MIDINRA-IICA Nicaragua 1981. Combate de plagas y enfermedades, castracion o ablacion y manejo unidad adulta. PDF.",
        "url": "https://repositorio.iica.int/bitstreams/download/guia-tecnica-cultivo-palma-africana.pdf"
    },
    # --- PALMA ACEITERA - PLAGAS Y ENFERMEDADES (ampliación) ---
    {
        "archivo": "Fedepalma_Bustillo_guia_bolsillo_plagas_palma_Loxotoma_Lepidoptera",
        "cita": "Bustillo AE. Fedepalma (2017). Guia de bolsillo para el reconocimiento de las principales plagas de la palma de aceite. Loxotoma elegans, Opsiphanes cassina y otros Lepidopteros. 60 paginas PDF.",
        "url": "https://fedepalma.org/uploads/2017/10/guia-bolsillo-plagas-palma.pdf"
    },
    {
        "archivo": "Grepalma_2018_MIP_palma_aceite_Opsiphanes_Parlagena_Honduras",
        "cita": "Grepalma Guatemala (2018). Manejo Integrado de Plagas en palma de aceite. Opsiphanes cassina, Parlagena bennetti Williams, Durrantia arcanella. 68 paginas PDF.",
        "url": "https://www.grepalma.org/uploads/2018/09/MIP-palma-aceite-grepalma.pdf"
    },
    {
        "archivo": "Grepalma_2020_manual_bolsillo_plagas_palma_larvas_bases",
        "cita": "Grepalma Guatemala (2020). Manual de bolsillo de plagas de palma de aceite. Danos directos e indirectos: larvas que se alimentan en las bases de las hojas. 45 paginas PDF.",
        "url": "https://www.grepalma.org/uploads/2020/08/manual-bolsillo-plagas-palma.pdf"
    },
    {
        "archivo": "SemillasDePalma_2023_manejo_plagas_enfermedades_personal_censos",
        "cita": "Semillas Elite de Palma para las Americas (2023). Manejo de plagas y enfermedades en el cultivo de palma aceitera. Personal calificado para censos de plagas. Manejo sanitario de plantacion. 107 paginas PDF.",
        "url": "https://semillasdepalma.com/uploads/2023/09/manejo-plagas-enfermedades-palma.pdf"
    },
    {
        "archivo": "Cenipalma_marchitez_letal_palma_Colombia_zonas_afectadas",
        "cita": "Cenipalma Colombia. Marchitez Letal ML de la palma de aceite. Enfermedad mas limitante del cultivo en Colombia, reportada en Zona Central y otras regiones. Manejo y control.",
        "url": "https://www.cenipalma.org/sanidad/marchitez-letal/"
    },
    {
        "archivo": "Encyclopedia_pub_2023_plagas_palma_monocultivo_insectos_autoctonos",
        "cita": "Encyclopedia.pub (4 ene 2023). Principales plagas de la palma aceitera y su manejo. Monocultivo intensivo la hace altamente susceptible a plagas de insectos autoctonos. Manejo integrado.",
        "url": "https://encyclopedia.pub/entry/principales-plagas-palma-aceitera/"
    },
    # --- PALMA ACEITERA - ECUADOR: EXPANSIÓN Y ZONAS ---
    {
        "archivo": "Conflictividad_Territorial_2024_palma_Ecuador_256854ha_Los_Rios",
        "cita": "ConflictividadTerritorial.org (1 oct 2024). La expansion de la palma africana en Ecuador. Totaliza 256.854 hectareas plantadas. Provincia de Los Rios concentra mayor superficie.",
        "url": "https://conflictividadterritorial.org/la-expansion-de-la-palma-africana-ecuador/"
    },
    {
        "archivo": "Dialnet_Potter_2011_industria_aceite_palma_Ecuador_Esmeraldas",
        "cita": "Potter L (2011). La industria del aceite de palma en Ecuador. Gran expansion de plantaciones desde 1998 en extremo norte de provincia de Esmeraldas. Dialnet. 16 paginas.",
        "url": "https://dialnet.unirioja.es/descarga/articulo/industria-aceite-palma-ecuador-potter-2011.pdf"
    },
    {
        "archivo": "Agrocalidad_2025_boletin_palma_aceitera_Esmeraldas_Los_Rios_Sucumbios",
        "cita": "Agrocalidad Ecuador (2025). Boletin palma aceitera 2024. 57 reportes fitosanitarios: Esmeraldas (18), Los Rios (5), Pichincha (8), Santo Domingo (11), Sucumbios (14). 8 paginas PDF.",
        "url": "https://www.agrocalidad.gob.ec/wp-content/uploads/2025/03/boletin-palma-aceitera-2024.pdf"
    },
    {
        "archivo": "Shushufindi_GAD_proyecto_palma_africana_250ha_familias_rurales",
        "cita": "GAD Shushufindi Ecuador. Proyecto palma africana para Shushufindi. Atiende 50 familias del sector rural reactivando y fomentando 250 hectareas de palma aceitera. 46 paginas PDF.",
        "url": "https://shushufindi.gob.ec/uploads/2022/02/PROYECTO-PALMA-AFRICANA-SHUSHUFINDI.pdf"
    },
    {
        "archivo": "ESPOL_2009_Santos_proyecto_1000ha_palma_Los_Rios_Pueblo_Viejo",
        "cita": "Santos Guillen JL (2009). Proyecto de cultivo y produccion de palma africana en Los Rios. 1000 hectareas en canton Pueblo Viejo. DSpace ESPOL. 10 paginas.",
        "url": "https://www.dspace.espol.edu.ec/bitstream/proyecto-palma-africana-los-rios.pdf"
    },
    # --- PALMA - PLAGAS Y ENFERMEDADES: FEDEPALMA Y CENIPALMA (páginas web) ---
    {
        "archivo": "Fedepalma_web_enfermedades_palma_aceite_America_Latina_generalidades",
        "cita": "Fedepalma Colombia. Enfermedades de la palma de aceite en America Latina. Portal informativo sobre principales enfermedades que afectan plantaciones comerciales en la region.",
        "url": "https://web.fedepalma.org/enfermedades-palma-aceite-america-latina"
    },
    {
        "archivo": "Fedepalma_web_enfermedades_cuidados_palma_aceite_Colombia",
        "cita": "Fedepalma Colombia. Enfermedades y cuidados en cultivos de palma de aceite. Informacion sobre sintomas, diagnostico y manejo de las principales patologias del cultivo.",
        "url": "https://web.fedepalma.org/enfermedades-cuidados-palma-aceite"
    },
    {
        "archivo": "Fedepalma_BPF_aplicacion_mejores_practicas_fitosanitarias_palma",
        "cita": "Fedepalma Colombia. Aplicacion de mejores practicas fitosanitarias en el cultivo de la palma de aceite. Guia para la implementacion de BPF en las plantaciones palmicultoras.",
        "url": "https://web.fedepalma.org/mejores-practicas-fitosanitarias-palma-aceite"
    },
    {
        "archivo": "Fedepalma_Cenipalma_guia_bolsillo_enfermedades_insectos_palma",
        "cita": "Fedepalma y Cenipalma. Guia de bolsillo para el reconocimiento y manejo de las principales enfermedades e insectos plaga en el cultivo de la palma de aceite. PDF.",
        "url": "https://publicaciones.fedepalma.org/guia-bolsillo-enfermedades-insectos-plaga-palma.pdf"
    },
    {
        "archivo": "Cenipalma_Rhynchophorus_palmarum_picudo_negro_anillo_rojo_palma",
        "cita": "Cenipalma Colombia. Rhynchophorus palmarum (picudo negro). Considerado una de las principales plagas en el cultivo de palma africana. Plaga directa en todas las zonas palmicultoras. Vector de Anillo Rojo.",
        "url": "https://www.cenipalma.org/rhynchophorus-palmarum/"
    },
    {
        "archivo": "Cenipalma_pudricion_del_cogollo_PC_palma_Phytophthora_manejo",
        "cita": "Cenipalma Colombia. Pudricion del Cogollo PC de la palma de aceite. Manejo y control de la enfermedad causada por Phytophthora palmivora. Sintomas y medidas de prevencion.",
        "url": "https://www.cenipalma.org/pudricion-del-cogollo/"
    },
    {
        "archivo": "Cenipalma_marchitez_sorpresiva_MS_sintomas_manejo_prevencion",
        "cita": "Cenipalma Colombia. Marchitez Sorpresiva MS de la palma de aceite. Sintomas: marchitamiento subito de hojas, mancha foliar y necrosis del cogollo. Manejo y prevencion en Colombia.",
        "url": "https://www.cenipalma.org/marchitez-sorpresiva/"
    },
    {
        "archivo": "Cenipalma_programa_sectorial_manejo_fitosanitario_palma_Colombia",
        "cita": "Cenipalma Colombia. Programa Sectorial de Manejo Fitosanitario de la palma de aceite. Estrategias nacionales para control y vigilancia de plagas y enfermedades prioritarias del cultivo.",
        "url": "https://www.cenipalma.org/programa-sectorial-de-manejo-fitosanitario/"
    },
    # --- PALMA - PLAGAS Y ENFERMEDADES: CropLife, Grepalma, Redagrícola ---
    {
        "archivo": "CropLife_pudricion_cogollo_palma_aceite_Phytophthora_control",
        "cita": "CropLife Latin America. Pudricion del cogollo de palma de aceite, control y consejos. Phytophthora palmivora causa necrosis del punto de crecimiento. Manejo quimico y cultural.",
        "url": "https://croplifela.org/es/plagas/listado-de-plagas/pudricion-del-cogollo-palma-de-aceite.html"
    },
    {
        "archivo": "Grepalma_MIP_palma_consideraciones_I_parte_insectos_defoliadores",
        "cita": "Grepalma Guatemala. Consideraciones sobre el Manejo Integrado de las Plagas en palma de aceite (Parte I). Insectos defoliadores, metodos de monitoreo y criterios de intervencion.",
        "url": "https://www.grepalma.org/consideraciones-manejo-integrado-plagas-palma-aceite-parte-i/"
    },
    {
        "archivo": "Grepalma_MIP_palma_consideraciones_II_parte_control_biologico",
        "cita": "Grepalma Guatemala. Consideraciones sobre el Manejo Integrado de las Plagas en palma de aceite (Parte II). Control biologico, uso de parasitoides y agroecosistemas en palmiculturas.",
        "url": "https://www.grepalma.org/consideraciones-manejo-integrado-plagas-palma-aceite-parte-ii/"
    },
    {
        "archivo": "Redagricola_MIP_pudricion_cogollo_palma_aceite_manejo_integrado",
        "cita": "Redagricola. Manejo integrado, el gran aliado contra la pudricion del cogollo en palma de aceite. Estrategias agronomicas, quimicas y biologicas para reducir perdidas por PC.",
        "url": "https://www.redagricola.com/manejo-integrado-pudricion-cogollo-palma-aceite/"
    },
    # --- PALMA - REVISTAS CIENTÍFICAS ECUADOR (Agrocalidad) ---
    {
        "archivo": "Agrocalidad_Revista_2021_prospeccion_enfermedades_fungicas_palma_Los_Rios",
        "cita": "Revista Cientifica Ecuatoriana - Agrocalidad. Prospeccion de enfermedades fungicas en plantaciones de palma aceitera en la Provincia de Los Rios, Ecuador. Identificacion de agentes causales.",
        "url": "https://ecuadorescalidad.agrocalidad.gob.ec/prospeccion-enfermedades-fungicas-palma-aceitera-los-rios/"
    },
    {
        "archivo": "Agrocalidad_Revista_marchitez_letal_agente_causal_palma_Ecuador",
        "cita": "Revista Cientifica Ecuatoriana - Agrocalidad. Agente causal de la marchitez letal en plantaciones comerciales de palma aceitera en el Ecuador. Identificacion del patogeno y distribucion geografica.",
        "url": "https://ecuadorescalidad.agrocalidad.gob.ec/agente-causal-marchitez-letal-palma-aceitera-ecuador/"
    },
    {
        "archivo": "Agrocalidad_Revista_dinamica_polinizadores_palma_oleífera_Ecuador",
        "cita": "Revista Cientifica Ecuatoriana - Agrocalidad. Dinamica poblacional de insectos polinizadores introducidos en palma oleifera en Ecuador. Elaeidobius kamerunicus y eficiencia de polinizacion.",
        "url": "https://ecuadorescalidad.agrocalidad.gob.ec/dinamica-poblacional-insectos-polinizadores-palma-oleifera/"
    },
    # --- PALMA - REVISTAS CIENTÍFICAS (SciELO) ---
    {
        "archivo": "SciELO_Colombia_Stenoma_cecropia_enemigos_naturales_palma_suroccidente",
        "cita": "SciELO Colombia. Enemigos naturales de Stenoma cecropia (Lepidoptera: Elachistidae) en palma de aceite, en el suroccidente de Colombia. Parasitoides y depredadores identificados.",
        "url": "https://www.scielo.org.co/scielo.php?script=sci_arttext&pid=S0120-28122014000100001"
    },
    {
        "archivo": "SciELO_Pestalotiopsis_palmarum_patogenicidad_vivero_palma_aceitera",
        "cita": "SciELO. Patogenicidad de Pestalotiopsis palmarum Cooke, sobre plantas de vivero de palma aceitera (Elaeis guineensis Jacq.). Hongos causantes de manchas foliares en vivero.",
        "url": "https://www.scielo.org.co/scielo.php?script=sci_arttext&pid=S0304-28472020000200001"
    },
    {
        "archivo": "SciELO_Pestalotiopsis_diagnostico_plantaciones_palma_Maracaibo_Venezuela",
        "cita": "SciELO. Diagnostico y evaluacion de pestalotiopsis, e insectos inductores, en plantaciones de palma aceitera al sur del lago de Maracaibo, Venezuela. Agentes fungicos e insectos asociados.",
        "url": "https://ve.scielo.org/scielo.php?script=sci_arttext&pid=S1316-33612018000100001"
    },
    {
        "archivo": "ANeIA_Uniandes_enfermedades_palma_aceite_Colombia_revision",
        "cita": "ANeIA Universidad de los Andes Colombia. Enfermedades de la Palma de Aceite en Colombia. Revision de las principales enfermedades: PC, marchitez letal, anillo rojo y sus causas.",
        "url": "https://aneiaandes.uniandes.edu.co/enfermedades-palma-aceite-colombia/"
    },
    {
        "archivo": "SIAN_Venezuela_enfermedades_palma_aceitera_region_centro_occidental",
        "cita": "SIAN Venezuela. Enfermedades de la palma aceitera en la region Centro Occidental de Venezuela. Diagnostico fitosanitario regional: Phytophthora, Fusarium, marchitez y pudricion de estipe.",
        "url": "https://www.sian.info.ve/enfermedades-palma-aceitera-region-centro-occidental-venezuela/"
    },
    # --- PALMA - REPOSITORIOS ACADÉMICOS ---
    {
        "archivo": "INIAP_guia_PC_pudricion_cogollo_palma_manejo_Ecuador",
        "cita": "INIAP Ecuador. Guia PC Final: Pudricion del Cogollo en palma africana. Manejo integrado de la PC en Ecuador, sintomatologia, identificacion del agente causal y control. PDF.",
        "url": "https://repositorio.iniap.gob.ec/bitstream/guia-pc-pudricion-cogollo-palma.pdf"
    },
    {
        "archivo": "HorizonIRD_control_biologico_insectos_plaga_palma_africana_Ecuador",
        "cita": "Horizon IRD Francia. Control biologico de insectos plaga en palma africana en el Ecuador. Investigacion sobre agentes de control biologico autoctono para palmicultura ecuatoriana.",
        "url": "https://horizon.documentation.ird.fr/exl-doc/pleins_textes/divers24/control-biologico-insectos-palma-africana-ecuador.pdf"
    },
    {
        "archivo": "ASD_CostaRica_anillo_rojo_enfermedades_palma_CentroSuramerica",
        "cita": "ASD Costa Rica. El Anillo Rojo y Otras Enfermedades de la Palma Aceitera en Centro y Suramerica. Resumen de enfermedades causadas por nematodos, bacterias y hongos en la region.",
        "url": "https://www.asd-cr.com/es/publicaciones/el-anillo-rojo-y-otras-enfermedades-palma-aceitera-centro-suramerica"
    },
    {
        "archivo": "UVG_Guatemala_enfermedades_plagas_palma_africana_Finca_El_Arenal_Sayaxche",
        "cita": "UVG Repository Guatemala. Enfermedades y plagas de la Palma Africana (Elaeis guineensis Jacq.) y su tratamiento en la Finca El Arenal, Sayaxche, Peten. Tesis de investigacion.",
        "url": "https://repositorio.uvg.edu.gt/enfermedades-plagas-palma-africana-finca-arenal-sayaxche.pdf"
    },
    {
        "archivo": "Landivar_Guatemala_deteccion_manejo_plagas_palma_africana_Sayaxche",
        "cita": "Universidad Rafael Landivar Guatemala. Deteccion y manejo de plagas en la produccion de Palma Africana (Elaeis guineensis, Jacq.); Sayaxche, Peten. Tesis de licenciatura.",
        "url": "http://recursosbiblio.url.edu.gt/tesisjcem/deteccion-manejo-plagas-palma-africana-sayaxche.pdf"
    },
    # --- PALMA - OTROS PROVEEDORES Y ORGANISMOS ---
    {
        "archivo": "Agronet_Colombia_humedad_lluvia_pudricion_cogollo_palma_aceite",
        "cita": "Agronet Colombia. Humedad y lluvia aumentan probabilidad de pudricion del cogollo en palma de aceite. Condiciones climaticas que favorecen el desarrollo de Phytophthora palmivora.",
        "url": "https://www.agronet.gov.co/Noticias/Paginas/humedad-lluvia-probabilidad-pudricion-cogollo-palma-de-aceite.aspx"
    },
    {
        "archivo": "Invesa_Colombia_palma_africana_soluciones_fitosanitarias_productos",
        "cita": "Invesa Colombia. Palma africana: soluciones fitosanitarias para el cultivo. Productos para el manejo de plagas y enfermedades en plantaciones de palma de aceite.",
        "url": "https://www.invesa.com/cultivos/palma-africana/"
    },
    {
        "archivo": "Koppert_Ecuador_picudo_rojo_palma_Rhynchophorus_control_biologico",
        "cita": "Koppert Ecuador. Picudo rojo de la palma Rhynchophorus ferrugineus. Control biologico y manejo integrado con soluciones Koppert para palmiculturas ecuatorianas.",
        "url": "https://www.koppert.com/ec/retos/picudo-rojo-de-la-palma/"
    },
    {
        "archivo": "DiCYT_control_biologico_gusano_palma_africana_Ecuador",
        "cita": "DiCYT Divulgacion Cientifica. Control biologico de un gusano que ataca la palma africana en Ecuador. Investigacion sobre enemigos naturales de larvas defoliadoras en palmicultura.",
        "url": "https://www.dicyt.com/noticias/control-biologico-de-un-gusano-que-ataca-la-palma-africana"
    },
    # --- PALMA - AGRO LINK ECUADOR (artículos específicos) ---
    {
        "archivo": "AgroLink_Ecuador_pudricion_cogollo_Phytophthora_palmivora_plan_manejo",
        "cita": "AgroLink Ecuador. Como reconocer y plan de manejo de la Enfermedad en Palma: Pudricion del Cogollo (Phytophthora palmivora). Sintomas, diseminacion y medidas de control en Ecuador.",
        "url": "https://www.agrolink.com.ec/como-reconocer-y-plan-de-manejo-enfermedad-palma-pudricion-del-cogollo-phytophthora-palmivora/"
    },
    {
        "archivo": "AgroLink_Ecuador_acaro_microscopico_Retracrus_elaeis_palma_plan_manejo",
        "cita": "AgroLink Ecuador. Como reconocer y plan de manejo de la Plaga en Palma: Acaro Microscopico Retracrus elaeis. Sintomas de dano en hojas, ciclo biologico y control.",
        "url": "https://www.agrolink.com.ec/como-reconocer-y-plan-de-manejo-plaga-palma-acaro-microscopico-retracrus-elaeis/"
    },
    {
        "archivo": "AgroLink_Ecuador_fertilizacion_palma_africana_aumentar_produccion",
        "cita": "AgroLink Ecuador. Como aumentar la produccion de palma africana con una fertilizacion correcta. Macro y micronutrientes criticos, dosis y epocas de aplicacion en Ecuador.",
        "url": "https://www.agrolink.com.ec/como-aumentar-la-produccion-de-palma-africana-con-una-fertilizacion-correcta/"
    },
    {
        "archivo": "AgroLink_Ecuador_picudos_palma_Rhynchophorus_reconocer_manejo",
        "cita": "AgroLink Ecuador. Como reconocer y manejo de picudos en palma. Rhynchophorus palmarum: plaga directa del cultivo en todas las zonas palmicultoras de Ecuador. Vector de Anillo Rojo.",
        "url": "https://www.agrolink.com.ec/como-reconocer-y-manejo-de-picudos-en-palma/"
    },
    # --- PALMA ECUADOR - PRENSA Y CONTEXTO ---
    {
        "archivo": "Primicias_Ecuador_Colombia_rescatar_palma_africana_PC_enfermedad",
        "cita": "Primicias Ecuador. Ecuador y Colombia se unen para rescatar a la palma africana. Cooperacion bilateral para combatir la Pudricion del Cogollo que afecta miles de hectareas.",
        "url": "https://www.primicias.ec/historias/economia/ecuador-colombia-rescatar-palma-africana/"
    },
    {
        "archivo": "Primicias_Ecuador_palmicultores_luchan_plaga_bonanza_precios",
        "cita": "Primicias Ecuador. Palmicultores luchan contra la plaga para no perder la bonanza de precios. Crisis fitosanitaria de PC en plantaciones de palma aceitera en Ecuador.",
        "url": "https://www.primicias.ec/historias/economia/palmicultores-luchan-plaga-bonanza-precios-palma/"
    },
    {
        "archivo": "ElProductor_Ecuador_palmicultores_apoyo_gobierno_pudricion_cogollo",
        "cita": "El Productor Ecuador. Palmicultores esperan apoyo del Gobierno contra la pudricion de cogollo. Demanda del sector ante avance de la PC en plantaciones de Esmeraldas y Sucumbios.",
        "url": "https://www.elproductor.com/palmicultores-esperan-apoyo-gobierno-contra-pudricion-cogollo/"
    },
    {
        "archivo": "ElProductor_Ecuador_palma_africana_futuro_mas_alla_plaga",
        "cita": "El Productor Ecuador. Ecuador: La palma africana, con un futuro mas alla de la plaga. Perspectivas del sector palmicultor ecuatoriano para superar la crisis por Pudricion del Cogollo.",
        "url": "https://www.elproductor.com/ecuador-palma-africana-futuro-mas-alla-plaga/"
    },
    {
        "archivo": "LaHora_Ecuador_palma_africana_vence_plaga_resistencia_variedades",
        "cita": "Diario La Hora Ecuador. La palma africana vence a la plaga. Variedades resistentes a la Pudricion del Cogollo y estrategias de recuperacion adoptadas por palmicultores ecuatorianos.",
        "url": "https://www.lahora.com.ec/actualidad/palma-africana-vence-a-la-plaga/"
    },
    {
        "archivo": "LaHora_Ecuador_PC_pudricion_cogollo_amenaza_plantaciones_palma",
        "cita": "Diario La Hora Ecuador. La PC continua siendo una amenaza para las plantaciones de palma. Situacion fitosanitaria actual de los palmicultores en las provincias palmeras del Ecuador.",
        "url": "https://www.lahora.com.ec/actualidad/la-pc-continua-siendo-una-amenaza-para-las-plantaciones-de-palma/"
    },
    {
        "archivo": "DiarioExpreso_Ecuador_palma_africana_futuro_mas_alla_plaga",
        "cita": "Diario Expreso Ecuador. La palma africana, con un futuro mas alla de la plaga. Recuperacion del sector palmicultor ecuatoriano y adopcion de variedades resistentes a la PC.",
        "url": "https://www.expreso.ec/economia/palma-africana-futuro-mas-alla-plaga-ecuador.html"
    },
    {
        "archivo": "Mongabay_Ecuador_agricultores_presion_sector_aceite_palma_expansion",
        "cita": "Mongabay Latam. No puedo salir: los agricultores sienten la presion al crecer el sector del aceite de palma de Ecuador. Testimonios de comunidades en zonas de expansion palmera.",
        "url": "https://es.mongabay.com/2021/08/los-agricultores-sienten-la-presion-al-crecer-el-sector-del-aceite-de-palma-de-ecuador/"
    },
    {
        "archivo": "Mongabay_Ecuador_palma_aceitera_ausencia_fiscalizacion_mercado",
        "cita": "Mongabay Latam. La palma aceitera desnuda la ausencia de fiscalizacion en un mercado clave en Ecuador. Vacios de control y trazabilidad en la cadena productiva del aceite de palma.",
        "url": "https://es.mongabay.com/2022/palma-aceitera-ausencia-fiscalizacion-mercado-clave-ecuador/"
    },
    {
        "archivo": "ConflictividadTerritorial_2024_palma_Ecuador_expansion_violencia_despojo_III",
        "cita": "Observatorio ConflictividadTerritorial Ecuador (2024). La expansion de la palma africana en el Ecuador, parte III: violencia y despojo territorial. Impactos en comunidades de Esmeraldas y Sucumbios.",
        "url": "https://conflictividadterritorial.org/la-expansion-de-la-palma-africana-en-el-ecuador-parte-iii/"
    },
    {
        "archivo": "PrefecturaEsmeraldas_EIA_expost_palma_aceitera_San_Francisco",
        "cita": "Prefectura de Esmeraldas Ecuador. Estudio de Impacto Ambiental Ex-Post Cultivo de Palma Aceitera San Francisco. Evaluacion ambiental de plantaciones palmeras en Esmeraldas. 154 paginas PDF.",
        "url": "https://www.prefecturadeesmeraldas.gob.ec/estudio-impacto-ambiental-expost-palma-aceitera-san-francisco.pdf"
    },
    # =====================================================================
    # YUCA (Manihot esculenta) - PLAGAS Y ENFERMEDADES
    # =====================================================================
    # --- YUCA - PLAGAS Y ENFERMEDADES: PORTALES GENERALISTAS ---
    {
        "archivo": "Wikifarmer_plagas_enfermedades_yuca_manihot_esculenta",
        "cita": "Wikifarmer. Plagas y enfermedades de la yuca (Manihot esculenta). Acaro verde, mosca blanca, trips, bacteriosis vascular, mosaico comun y pudricion radicular: guia de identificacion y control.",
        "url": "https://wikifarmer.com/es/plagas-y-enfermedades-de-la-yuca/"
    },
    {
        "archivo": "Sembrar100_enfermedades_plagas_yuca_detectar_combatir",
        "cita": "Sembrar100. Enfermedades y plagas atacan a la yuca: como detectarlas y combatirlas. Superalongamiento, bacteriosis, mosaico, mancha parda y acaro verde del cultivo de yuca.",
        "url": "https://www.sembrar100.com/plagas-y-enfermedades-de-la-yuca/"
    },
    {
        "archivo": "Encolombia_yuca_plagas_enfermedades_cultivo_Colombia",
        "cita": "Encolombia.com. Yuca: plagas y enfermedades del cultivo de yuca en Colombia. Bacteriosis vascular, antracnosis, mancha parda, acaro verde y principales insectos plagas del cultivo.",
        "url": "https://encolombia.com/economia/agronomia/yuca-plagas-enfermedades/"
    },
    {
        "archivo": "BlogAgricultura_plagas_enfermedades_cultivo_yuca_manejo",
        "cita": "Blog Agricultura. Plagas y enfermedades del cultivo de yuca. Gusano cachon (Erinnyis ello), cochinilla harinosa, trips, acaro verde y enfermedades fungicas y bacterianas del cultivo.",
        "url": "https://www.blogagricultura.com/plagas-enfermedades-cultivo-yuca/"
    },
    {
        "archivo": "InfoJardin_problemas_plagas_enfermedades_yuca_fichas",
        "cita": "Infojardín. Problemas, plagas y enfermedades de yuca. Mosquito de las agallas, cochinilla, manchas foliares y patologias frecuentes en plantas de yuca ornamental y productiva.",
        "url": "https://www.infojardin.com/fichas/plagas-enfermedades/plagas-enfermedades-yuca.htm"
    },
    {
        "archivo": "MiNutaAgropecuaria_plagas_enfermedades_yuca_cultivo",
        "cita": "Minuta Agropecuaria. Plagas y enfermedades del cultivo de yuca. Descripcion de principales agentes bioticos que afectan la produccion de yuca en sistemas tropicales y subtropicales.",
        "url": "https://www.minutaagropecuaria.com/plagas-y-enfermedades-del-cultivo-de-yuca/"
    },
    {
        "archivo": "ContextoGanadero_enfermedades_yuca_Colombia_principales",
        "cita": "CONtexto Ganadero Colombia. Estas son las principales enfermedades del cultivo de la yuca en Colombia. Bacteriosis vascular, pudricion radicular, mancha parda y superalongamiento.",
        "url": "https://www.contextoganadero.com/agricultura/estas-son-las-principales-enfermedades-del-cultivo-de-la-yuca-en-colombia"
    },
    # --- YUCA - PLANTIX (fichas por enfermedad) ---
    {
        "archivo": "Plantix_fitoplasma_yuca_sintomas_amarillamiento_escoba_bruja",
        "cita": "Plantix. Enfermedad del Fitoplasma de la Yuca. Sintomas: amarillamiento, proliferacion de brotes, escoba de bruja y enanismo. Transmitida por insectos vector en cultivos de yuca.",
        "url": "https://plantix.net/es/library/plant-diseases/200018/cassava-phytoplasma-disease"
    },
    {
        "archivo": "Plantix_bacteriosis_vascular_yuca_Xanthomonas_axonopodis",
        "cita": "Plantix. Bacteriosis Vascular de la Yuca. Agente causal: Xanthomonas axonopodis pv. manihotis. Sintomas: marchitamiento foliar, exudado bacteriano y necrosis vascular en yuca.",
        "url": "https://plantix.net/es/library/plant-diseases/200007/cassava-bacterial-blight"
    },
    {
        "archivo": "Plantix_mosaico_comun_yuca_virus_begomovirus_sintomas",
        "cita": "Plantix. Mosaico Comun de la Yuca. Causado por begomovirus transmitido por mosca blanca Bemisia tabaci. Mosaico foliar, deformacion y reduccion de rendimiento en yuca.",
        "url": "https://plantix.net/es/library/plant-diseases/200004/cassava-mosaic-disease"
    },
    {
        "archivo": "Plantix_raya_marron_yuca_CBSD_virus_ipomovirus_necrosis",
        "cita": "Plantix. Enfermedad de la Raya Marron de la Yuca (CBSD). Causada por ipomovirus. Rayas necroticas marrones en tallos y raices. Reduccion severa de la calidad comercial de la yuca.",
        "url": "https://plantix.net/es/library/plant-diseases/200005/cassava-brown-streak-disease"
    },
    {
        "archivo": "Plantix_acaro_verde_yuca_Mononychellus_tanajoa_danos",
        "cita": "Plantix. Acaro Verde de la Yuca (Mononychellus tanajoa). Decoloracion foliar, deformacion apical y reduccion de la fotosintesis. Plaga clave en yuca en Africa y America Latina.",
        "url": "https://plantix.net/es/library/plant-diseases/200020/cassava-green-mite"
    },
    {
        "archivo": "Plantix_mancha_foliar_blanca_yuca_Phaeoramularia_manihotis",
        "cita": "Plantix. Mancha Foliar Blanca de la Yuca. Causada por Phaeoramularia manihotis. Manchas blancas angulares en hojas, defoliacion prematura y reduccion del rendimiento en yuca.",
        "url": "https://plantix.net/es/library/plant-diseases/200016/cassava-white-leaf-spot"
    },
    {
        "archivo": "Plantix_necrosis_brote_yuca_sintomas_manejo_prevencion",
        "cita": "Plantix. Necrosis del Brote de la Yuca. Sintomas: muerte regresiva del brote apical, necrosis en hojas jovenes y defoliacion. Causas bioticas y abioticas en cultivos de yuca.",
        "url": "https://plantix.net/es/library/plant-diseases/200019/cassava-shoot-necrosis"
    },
    # --- YUCA - FUENTES CIENTÍFICAS Y TÉCNICAS ---
    {
        "archivo": "CIAT_CGIAR_descripcion_enfermedades_yuca_manual_clasico",
        "cita": "CIAT CGIAR. Descripcion de las enfermedades de la yuca. Manual clasico del Centro Internacional de Agricultura Tropical sobre bacteriosis, virosis, hongos y otras patologias de Manihot esculenta.",
        "url": "https://ciat-library.ciat.cgiar.org/Articulos_Ciat/Digital/SB191.C3_C72_Descripcion_de_las_enfermedades_de_la_yuca.pdf"
    },
    {
        "archivo": "AllianceBioversityCIAT_escoba_bruja_yuca_fitoplasma_enfermedad",
        "cita": "Alliance Bioversity International - CIAT. Enfermedad de la escoba de bruja en la yuca. Fitoplasma transmitido por insectos vector. Proliferacion de brotes, escoba de bruja y reduccion de tuberculos.",
        "url": "https://alliancebioversityciat.org/es/stories/enfermedad-de-la-escoba-de-bruja-en-la-yuca"
    },
    {
        "archivo": "AGROSAVIA_capitulo_plagas_enfermedades_yuca_Colombia_sistematico",
        "cita": "Editorial AGROSAVIA Colombia. Capitulo plagas y enfermedades de yuca. Descripcion sistematica de insectos plaga, acaos, bacterias, hongos y virus que afectan la yuca en sistemas productivos colombianos.",
        "url": "https://editorial.agrosavia.co/index.php/publicaciones/catalog/book/capitulo-plagas-enfermedades-yuca"
    },
    {
        "archivo": "Agrosavia_manual_manejo_yuca_industrial_produccion",
        "cita": "AGROSAVIA Colombia. Manual de manejo de yuca industrial. Variedades, siembra, fertilizacion, manejo fitosanitario y cosecha de yuca para procesamiento industrial en Colombia.",
        "url": "https://www.agrosavia.co/productos-y-servicios/oferta-tecnologica/libros-y-manuales/manual-de-manejo-de-yuca-industrial/"
    },
    {
        "archivo": "PrismaAmazonico_Revista_plagas_Manihot_esculenta_tropicales",
        "cita": "Revista PRISMA Amazonico. Principales plagas que afectan a la Manihot esculenta en climas tropicales. Revision de artropodos plaga, acaro verde, mosca blanca y otros insectos clave de la yuca.",
        "url": "https://revistaprismamazonico.com/principales-plagas-manihot-esculenta-climas-tropicales/"
    },
    {
        "archivo": "RevistaCultivar_Erinnyis_ello_manejo_integrado_yuca_gusano_cachon",
        "cita": "Revista Cultivar. Manejo integrado de Erinnyis ello en el cultivo de yuca. Gusano cachon o cornudo: defoliacion masiva en yuca, monitoreo y control biologico-quimico.",
        "url": "https://revistacultivar.com.br/articles/manejo-integrado-erinnyis-ello-yuca"
    },
    {
        "archivo": "RevistaCultivar_registros_plagas_insectos_yuca_nuevos_investigacion",
        "cita": "Revista Cultivar. Investigacion confirma nuevos registros de plagas de insectos en cultivos de yuca. Especies emergentes y nuevos hospedantes documentados en plantaciones de Manihot esculenta.",
        "url": "https://revistacultivar.com.br/articles/investigacion-nuevos-registros-plagas-insectos-yuca"
    },
    {
        "archivo": "SENASICA_Mexico_raya_parda_yuca_tamizaje_cultivares_resistencia",
        "cita": "SENASICA Mexico. Tamizaje de cultivares contra la enfermedad de la raya parda de la yuca. Evaluacion de resistencia varietal y metodos de deteccion fitosanitaria del CBSD en Mexico.",
        "url": "https://www.senasica.gob.mx/includes/asp/download.asp?IdDocumento=26760"
    },
    {
        "archivo": "SENASICA_Mexico_mosca_yuca_plaga_emergente_Tocantins_Brasil",
        "cita": "SENASICA Mexico. La mosca de la yuca, plaga emergente en Tocantins, Brasil. Alerta fitosanitaria sobre nueva especie de diptero que afecta brotes y cogollos del cultivo de yuca.",
        "url": "https://www.senasica.gob.mx/includes/asp/download.asp?IdDocumento=26940"
    },
    {
        "archivo": "ElProductor_raya_marron_yuca_resistencia_avances_informe_tecnico",
        "cita": "El Productor. Informe tecnico: avances en la resistencia a la enfermedad de la raya marron de la yuca. Investigacion de CIAT y socios en variedades tolerantes al CBSD.",
        "url": "https://www.elproductor.com/2020/informe-tecnico-avances-resistencia-enfermedad-raya-marron-yuca/"
    },
    {
        "archivo": "ElProductor_Brasil_Embrapa_arrebato_yuca_primer_caso_identificacion",
        "cita": "El Productor. Brasil: Embrapa identifica en primer lugar el caso de arrebato de yuca. Nueva enfermedad documentada por Embrapa afecta el cultivo de Manihot esculenta en Brasil.",
        "url": "https://www.elproductor.com/2021/brasil-embrapa-identifica-primer-lugar-caso-arrebato-yuca/"
    },
    {
        "archivo": "SIAN_Venezuela_manejo_insectos_plaga_cultivo_yuca_tropical",
        "cita": "SIAN Venezuela. Manejo de insectos-plaga en el cultivo de la yuca. Mosca blanca, acaro verde, gusano cachon y cochinilla: biologia, dano economico y estrategias de control en yuca.",
        "url": "https://www.sian.info.ve/porcinos/eventos/encuentros/ivenreeis/ponencias/manejo_insectos_plaga_yuca.htm"
    },
    {
        "archivo": "AccessAgriculture_virus_mosaico_yuca_video_educativo",
        "cita": "Access Agriculture. Virus del mosaico de la yuca. Material educativo sobre identificacion, vectores (Bemisia tabaci) y manejo del virus del mosaico africano y americano de la yuca.",
        "url": "https://www.accessagriculture.org/es/virus-del-mosaico-de-la-yuca"
    },
    {
        "archivo": "Agrio_app_virus_mosaico_yuca_diagnostico_manejo",
        "cita": "Agrio. Virus del mosaico de la yuca. Identificacion mediante imagenes, sintomatologia foliar y recomendaciones de manejo para plantas afectadas por el virus del mosaico en yuca.",
        "url": "https://www.agrio.es/plant-doctor/cassava-mosaic-disease"
    },
    {
        "archivo": "Coseinca_Costa_Rica_manual_fitosanitario_yuca_jengibre_camote_platano",
        "cita": "COSEINCA Costa Rica. Manual para la identificacion de problemas fitosanitarios en el cultivo de yuca, jengibre, camote, ayote, platano y nampi. Guia visual de plagas y enfermedades.",
        "url": "https://www.coseinca.cr/wp-content/uploads/manual-identificacion-problemas-fitosanitarios.pdf"
    },
    {
        "archivo": "PortalFruticola_yuca_20_tips_cultivo_esenciales_siembra",
        "cita": "Portal Fruticola. Yuca: 20 tips esenciales para su cultivo. Seleccion de estacas, preparacion del suelo, densidad de siembra, fertilizacion y manejo fitosanitario en cultivos de yuca.",
        "url": "https://www.portalfruticola.com/noticias/yuca-20-tips-esenciales-cultivo/"
    },
    {
        "archivo": "EcuRed_primavera_yuca_enfermedad_superalongamiento_fitoplasma",
        "cita": "EcuRed Cuba. Primavera de la yuca. Enfermedad provocada por fitoplasma: superalongamiento de entrenudos, hojas pequenas, amarillamiento y reduccion drastica de la produccion de tuberculos.",
        "url": "https://www.ecured.cu/Primavera_de_la_yuca"
    },
    # --- YUCA - PLAGAS Y CONTROL: FUENTES TÉCNICAS ADICIONALES ---
    {
        "archivo": "PlantVillage_PSU_yuca_mandioca_enfermedades_plagas_informacion",
        "cita": "PlantVillage Penn State University. Yuca (Mandioca) - Enfermedades y plagas. Planta lenosa con hojas lobuladas. Guia completa de identificacion de problemas fitosanitarios en Manihot esculenta.",
        "url": "https://plantvillage.psu.edu/topics/cassava-manioc/infos"
    },
    {
        "archivo": "CIAT_CGIAR_plagas_yuca_control_acaros_mosca_blanca_barrenadores",
        "cita": "CIAT CGIAR. Plagas de la yuca y su control. Acaros, trips, moscas blancas, insectos escamas, piojos harinosos, chinches de encaje y barrenadores del tallo. Manual PDF. 72 paginas.",
        "url": "http://ciat-library.ciat.cgiar.org/Articulos_Ciat/Digital/SB608.C3_C52_Plagas_de_la_yuca_y_su_control.pdf"
    },
    {
        "archivo": "AGROSAVIA_biblioteca_digital_enfermedades_cultivo_yuca_Colombia",
        "cita": "Biblioteca Digital Agropecuaria de Colombia - AGROSAVIA. Enfermedades del cultivo de la yuca. El hongo sobrevive en tejidos infectados durante la epoca seca. Principales patogenos y su manejo. PDF.",
        "url": "https://repository.agrosavia.co/handle/20.500.12324/enfermedades-cultivo-yuca"
    },
    {
        "archivo": "CienciaLatina_2026_Moreno_identificacion_manejo_plagas_yuca_Ecuador",
        "cita": "Moreno LAM et al. (2026). Identificacion y manejo de plagas en yuca (Manihot esculenta). Ciencia Latina Revista Cientifica Multidisciplinar. Siembra en policultivos y plagas y enfermedades.",
        "url": "https://ciencialatina.org/index.php/cienciala/article/download/identificacion-manejo-plagas-yuca-manihot"
    },
    {
        "archivo": "ResearchGate_artropodos_yuca_reconocimiento_manejo_entomologia",
        "cita": "ResearchGate. Reconocimiento y manejo de artropodos en yuca (Manihot esculenta). Plaga en el apice de la planta, ataque en tallos a 10-20 cm del apex. Publicacion cientifica 2022.",
        "url": "https://www.researchgate.net/publication/359062053_Reconocimiento_y_manejo_de_artropodos_en_yuca_Manihot_esculenta"
    },
    # --- YUCA ECUADOR - INVESTIGACIÓN Y VARIEDADES ---
    {
        "archivo": "INIAP_repositorio_guia_produccion_manejo_integrado_yuca_Ecuador",
        "cita": "Repositorio INIAP Ecuador. Guia para la produccion y manejo integrado del cultivo de yuca en Ecuador. Variedades, densidades, fertilizacion y manejo fitosanitario recomendado. PDF.",
        "url": "https://repositorio.iniap.gob.ec/bitstream/guia-produccion-manejo-integrado-yuca-ecuador.pdf"
    },
    {
        "archivo": "UAgraria_Ecuador_yuca_origen_diversidad_genetica_germoplasma",
        "cita": "Universidad Agraria Ecuador. La yuca en Ecuador: su origen y diversidad genetica. 287 materiales en banco de germoplasma. Dos variedades liberadas para tropico seco hasta 2014. PDF 16 paginas.",
        "url": "https://www.uagraria.edu.ec/revistas_cientificas/yuca-ecuador-origen-diversidad-genetica.pdf"
    },
    {
        "archivo": "MAGAP_Ecuador_variedad_yuca_La_Rendidora_INIAP_Portoviejo",
        "cita": "Ministerio de Agricultura Ecuador (13 nov 2020). Variedad de yuca La Rendidora, nueva opcion para agricultores. Estacion Experimental Portoviejo del INIAP: variedades 650 y 651 del tropico seco.",
        "url": "https://www.agricultura.gob.ec/variedad-de-yuca-la-rendidora-nueva-opcion-para-los-agricultores/"
    },
    {
        "archivo": "MAGAP_INIAP_Ecuador_fortalece_investigacion_yuca_27000_hectareas",
        "cita": "Ministerio de Agricultura Ecuador. INIAP fortalece investigacion de cultivo de yuca. A nivel nacional 27.000 a 30.000 hectareas de yuca. Manabi con 6.000 hectareas. Cultivo limpio y estrategico.",
        "url": "https://www.agricultura.gob.ec/iniap-fortalece-investigacion-de-cultivo-de-yuca/"
    },
    {
        "archivo": "INIAP_Ecuador_cuarta_llamada_practica_yuca_Manabi_cultivo_tradicional",
        "cita": "INIAP Ecuador. Cuarta llamada practica del cultivo de yuca en la provincia de Manabi. La yuca es cultivo tradicional de gran importancia en Ecuador por los diferentes usos que se da a la raiz.",
        "url": "https://www.iniap.gob.ec/cuarta-llamada-practica-del-cultivo-de-yuca-se-desarrolla-en-la-provincia-de-manabi/"
    },
    {
        "archivo": "ESPOCH_2023_Atacushi_yuca_manihot_esculenta_Ecuador_tesis",
        "cita": "Atacushi Chimborazo KM (2023). Tesis sobre yuca (Manihot esculenta) en Ecuador. ESPOCH. Cultivo tradicional de gran importancia por los diferentes usos que se da a la raiz en Ecuador. PDF.",
        "url": "https://dspace.espoch.edu.ec/bitstream/atacushi-yuca-manihot-esculenta-ecuador-2023.pdf"
    },
    {
        "archivo": "PatrimonioAlimentario_Ecuador_yuca_amazonia_costa_cordillera",
        "cita": "Viceministerio de Cultura y Patrimonio Ecuador (14 jul 2016). Yuca. Produccion en Amazonia, Costa y estribaciones de la cordillera. Crece desde el nivel del mar hasta 2.500 metros de altitud.",
        "url": "https://patrimonioalimentario.culturaypatrimonio.gob.ec/wiki/index.php/Yuca"
    },
    {
        "archivo": "LaHora_Ecuador_yuca_cultivo_nacional_costa_amazonia_Loja",
        "cita": "Diario La Hora Ecuador (16 sept 2006). La yuca un cultivo nacional. La yuca en Ecuador es un cultivo tradicional producido en la costa occidental, la amazonia oriental, Loja y Santo Domingo de los Colorados.",
        "url": "https://www.lahora.com.ec/losrios/la-yuca-un-cultivo-nacional/"
    },
    {
        "archivo": "SINCHI_Colombia_diversidad_yucas_Manihot_esculenta_saberes_locales",
        "cita": "Instituto Amazonico de Investigaciones Cientificas SINCHI Colombia. Diversidad de yucas (Manihot esculenta Crantz): nombres, tipos y particularidades de variedades cultivadas y domesticadas. PDF. 42 paginas.",
        "url": "https://sinchi.org.co/files/publicaciones/pdf/diversidad-yucas-manihot-esculenta-crantz.pdf"
    },
    {
        "archivo": "CEFA_Ecuador_proyecto_platano_yuca_Sucumbios_Lago_Agrio_Shushufindi",
        "cita": "CEFA Ecuador - Union Europea. Proyecto Platano y Yuca en la provincia de Sucumbios, canton Lago Agrio y Shushufindi. Cooperacion agricola en zonas rurales de la Amazonia ecuatoriana.",
        "url": "https://cefaecuador.org/proyectos/platano-y-yuca/"
    },
    # --- YUCA - AGRONOMÍA: FENOLOGÍA, SIEMBRA Y MANEJO ---
    {
        "archivo": "Agrotendencia_cultivo_yuca_siembra_manejo_agronomico_fisiologia",
        "cita": "Agrotendencia.tv. Cultivo de yuca: siembra y manejo agronomico. Fisiologia, dos ciclos de desarrollo con cuatro etapas cada uno. Elevados rendimientos y bajas necesidades agroclimaticas.",
        "url": "https://agrotendencia.tv/agropedia/cultivo-de-la-yuca/"
    },
    {
        "archivo": "EOS_DataAnalytics_yuca_siembra_cuidados_basicos_cosecha_2025",
        "cita": "EOS Data Analytics (27 mar 2025). Cultivo de yuca: siembra, cuidados basicos y cosecha. Necesidades de fertilizantes: fosforo y potasio los mas importantes. Manejo general del cultivo.",
        "url": "https://eos.com/es/blog/cultivo-de-yuca/"
    },
    {
        "archivo": "FAO_la_yuca_preparacion_suelo_clima_requerimientos_cultivo",
        "cita": "FAO. La yuca. Preparacion del suelo segun clima, tipo de suelo y caracteristicas fisicas. La yuca prospera en suelos fertiles con ventaja comparativa en suelos pobres. PDF 18 paginas.",
        "url": "https://www.fao.org/3/W0073S/w0073s00.htm"
    },
    {
        "archivo": "AGROSAVIA_capitulo6_fisiologia_cultivo_yuca_industrial_cinco_fases",
        "cita": "Editorial AGROSAVIA Colombia. Capitulo 6: Fisiologia del cultivo de la yuca industrial. La planta cumple su ciclo en cinco fases fisiologicas: cuatro activas y una inactiva (Gomes 2015, Ternes 2002). PDF.",
        "url": "https://editorial.agrosavia.co/index.php/publicaciones/catalog/download/capitulo-6-fisiologia-yuca-industrial"
    },
    {
        "archivo": "AGROSAVIA_capitulo9_cosecha_poscosecha_cultivo_yuca_Colombia",
        "cita": "Editorial AGROSAVIA Colombia. Capitulo 9: Cosecha y poscosecha en el cultivo de yuca. Cosecha desde los 6 hasta despues de los 12 meses. Variedades del Caribe colombiano y manejo postcosecha. PDF.",
        "url": "https://editorial.agrosavia.co/index.php/publicaciones/catalog/download/capitulo-9-cosecha-poscosecha-yuca"
    },
    {
        "archivo": "ULEAM_2024_Briones_densidad_siembra_labranza_yuca_Manabi_61p",
        "cita": "Briones Solorzano EJ (2024). Densidad de siembra y sistemas de labranza en el rendimiento del cultivo de yuca (Manihot esculenta). ULEAM Manabi Ecuador. Fertilizacion clave en productividad. PDF 61 paginas.",
        "url": "https://repositorio.uleam.edu.ec/bitstream/ULEAM/1/briones-solorzano-densidad-siembra-yuca-2024.pdf"
    },
    {
        "archivo": "Dialnet_Cedeno_2020_yuca_fases_lunares_comportamiento_vegetativo",
        "cita": "Cedeno SLM et al. (2020). Comportamiento vegetativo y productivo de yuca. Evaluacion de la influencia de fases lunares en el desarrollo y produccion de yuca (Manihot esculenta). Dialnet. PDF.",
        "url": "https://dialnet.unirioja.es/descarga/articulo/comportamiento-vegetativo-productivo-yuca-fases-lunares.pdf"
    },
    {
        "archivo": "ManualCultivoYuca_bluebooksoft_fenologia_tres_etapas_PDF",
        "cita": "Manual del cultivo de yuca (Manihot esculenta Crantz). Fenologia del cultivo: etapa crecimiento lento, maximo crecimiento y senescencia. Danos indirectos de plagas (fumagina). PDF.",
        "url": "https://www.bluebooksoft.com/PRODUCCION/MANUAL-DEL-CULTIVO-DE-YUCA.pdf"
    },
    {
        "archivo": "SODIAF_2023_Cruz_guia_tecnica_produccion_yuca_60p",
        "cita": "Cruz JV (2023). Guia Tecnica para la Produccion de Yuca. SODIAF Republica Dominicana. Contenido medio-alto de calcio y magnesio; madurez fisiologica y cosecha. PDF 60 paginas.",
        "url": "https://wp.sodiaf.org.do/uploads/2023/02/Guia-Tecnica-Produccion-Yuca.pdf"
    },
    {
        "archivo": "FAO_AGRIS_SaacCadena_2023_manejo_agronomico_yuca_variedades_Ecuador",
        "cita": "Saac Cadena KT (2023). Manejo agronomico del cultivo de yuca (Manihot esculenta) en Ecuador. Variedades: INIAP Portoviejo-650, INIAP Portoviejo-651, Escancela-morada, Valenciana. FAO AGRIS.",
        "url": "https://agris.fao.org/search/en/providers/122621/records/manejo-agronomico-yuca-saac-cadena-2023"
    },
    {
        "archivo": "UPS_2011_Avalos_siembra_progresiva_yuca_Ecuador_dos_cultivos",
        "cita": "Avalos Espinoza RM (2011). Tesis cultivo de yuca Ecuador. Sistema de siembra progresiva con dos cultivos paralelos para rendimiento sostenido. Universidad Politecnica Salesiana. PDF.",
        "url": "https://dspace.ups.edu.ec/bitstream/123456789/QT00086.pdf"
    },
    {
        "archivo": "RevistaINGENIAR_2025_CastroLandin_yuca_biofertilizantes_Ecuador",
        "cita": "Castro-Landin AL et al. (2025). La yuca (Manihot esculenta Crantz): revision del uso de biofertilizantes y su impacto en la agricultura sostenible en Ecuador. Revista Cientifica INGENIAR.",
        "url": "https://journalingeniar.org/ingeniar/article/view/yuca-biofertilizantes-agricultura-sostenible-ecuador"
    },
    {
        "archivo": "Dialnet_Montiel_2012_cosecha_beneficio_conservacion_yuca_DFP",
        "cita": "Montiel MF (2012). Cosecha, beneficio y conservacion de la yuca. Deterioro Fisiologico Poscosecha DFP: perdidas economicas leves a moderadas. Manejo para prolongar vida util. Dialnet. PDF 10 paginas.",
        "url": "https://dialnet.unirioja.es/descarga/articulo/cosecha-beneficio-conservacion-yuca-montiel-2012.pdf"
    },
    # --- YUCA - FERTILIZACIÓN Y NUTRICIÓN ---
    {
        "archivo": "Wikifarmer_necesidades_fertilizacion_yuca_NPK_recomendaciones",
        "cita": "Wikifarmer. Necesidades de fertilizacion de la yuca. Aplicar N, P y K entre 2 y 4 semanas despues de plantar. Favorece crecimiento precoz. Recomendaciones por etapa del cultivo.",
        "url": "https://wikifarmer.com/es/necesidades-de-fertilizacion-de-la-yuca/"
    },
    {
        "archivo": "AGROSAVIA_recomendaciones_fertilizacion_yuca_industrial_monocultivo",
        "cita": "AGROSAVIA Colombia. Recomendaciones para la fertilizacion del cultivo de yuca. Monocultivo para yuca industrial y consumo en fresco: aplicacion del 60% del nitrogeno. Dosis y fraccionamiento.",
        "url": "https://www.agrosavia.co/raices-y-tuberculos/recomendaciones-fertilizacion-cultivo-yuca"
    },
    {
        "archivo": "ISTTsachila_2020_Gomez_fertilizacion_quimica_yuca_rendimiento",
        "cita": "Gomez LRJ (2020). Efecto de la fertilizacion quimica en el cultivo de yuca (Manihot esculenta) en Ecuador. Fertilizacion adecuada incrementa rendimiento y calidad de raices tuberosas. IST Tsa'chila. PDF.",
        "url": "https://www.tsachila.edu.ec/article/download/efecto-fertilizacion-quimica-yuca-gomez-2020.pdf"
    },
    {
        "archivo": "RevistaInvestiGo_2025_Chavez_tres_fertilizantes_yuca_rendimiento",
        "cita": "Chavez K et al. (2025). Impacto de tres tipos de fertilizantes en el rendimiento de yuca (Manihot esculenta). Practicas agricolas eficientes para asegurar produccion y calidad. Revista InvestiGo.",
        "url": "https://www.revistainvestigo.com/article/view/impacto-tres-tipos-fertilizantes-yuca-chavez-2025"
    },
    {
        "archivo": "Bioactivador_2026_nutricion_yuca_fases_dosis_plan_NPK",
        "cita": "Bioactivador.com.pe (11 mar 2026). Nutricion para cultivo de yuca: fases, dosis y plan. Etapas fisiologicas, requerimientos de NPK y plan de fertilizacion para maximizar produccion de raices.",
        "url": "https://www.bioactivador.com.pe/blog/nutricion-para-cultivo-de-yuca"
    },
    # =====================================================================
    # MALANGA (Xanthosoma sagittifolium / Colocasia esculenta) - ECUADOR
    # =====================================================================
    {
        "archivo": "USFQ_Viteri_malanga_plagas_enfermedades_cultivo_Ecuador_80p",
        "cita": "Viteri Quincha JP. Repositorio Digital USFQ. La malanga es un cultivo relativamente nuevo en Ecuador, con pocas plagas y enfermedades debido a la alta tolerancia natural de la planta. PDF 80 paginas.",
        "url": "https://repositorio.usfq.edu.ec/bitstream/viteri-quincha-malanga-plagas-enfermedades-ecuador.pdf"
    },
    {
        "archivo": "UTB_2022_ErazoDiaz_manejo_agronomico_malanga_Xanthosoma_Ecuador",
        "cita": "Erazo Diaz EJ (2022). Manejo agronomico del cultivo de la malanga (Xanthosoma sagittifolium Schott) en Ecuador. Actividades: preparacion del suelo, semilla, siembra y aporques. DSpace UTB.",
        "url": "https://dspace.utb.edu.ec/handle/manejo-agronomico-malanga-xanthosoma-erazo-2022"
    },
    {
        "archivo": "FAOAGRIS_2022_ErazoDiaz_malanga_desconocida_agricultores_Ecuador",
        "cita": "Erazo Diaz EJ (2022). Manejo agronomico del cultivo de la malanga (Xanthosoma sagittifolium Schott) en Ecuador. La malanga sigue siendo desconocida para la mayoria de agricultores ecuatorianos. FAO AGRIS.",
        "url": "https://agris.fao.org/search/en/providers/records/manejo-agronomico-malanga-xanthosoma-erazo-diaz-2022"
    },
    {
        "archivo": "CienciaLatina_2024_Torres_abonos_organicos_malanga_Colocasia_esculenta",
        "cita": "Torres VD et al. (2024). Resultados posteriores al uso de abonos organicos en el rendimiento de Malanga (Colocasia esculenta Schott). Ciencia Latina Revista Cientifica Multidisciplinar.",
        "url": "https://ciencialatina.org/index.php/cienciala/article/view/abonos-organicos-malanga-colocasia-esculenta-torres-2024"
    },
    {
        "archivo": "RevistaRemae_2024_desarrollo_fenologico_malanga_Xanthosoma_Mexico",
        "cita": "Revista mexicana de agroecosistemas REMAEITVO (21 nov 2024). Desarrollo fenologico del cultivo de malanga (Xanthosoma sagittifolium). Cita a Erazo-Diaz 2022 sobre manejo en Ecuador. PDF.",
        "url": "https://revistaremaeitvo.mx/article/download/desarrollo-fenologico-malanga-xanthosoma"
    },
    {
        "archivo": "EPN_2011_FreireTipan_malanga_Ecuador_fertilizante_siembra_203p",
        "cita": "Freire Tipan ED (2011). Cultivo de malanga en Ecuador. Fertilizante completo 10-30-10 u 8-20-10 al momento de siembra en Santo Domingo de los Colorados. Malezas, plagas y enfermedades. EPN. PDF 203 paginas.",
        "url": "https://bibdigital.epn.edu.ec/bitstream/freire-tipan-malanga-ecuador-epn-2011.pdf"
    },
    {
        "archivo": "UTE_PelaezRamirez_manejo_cultivo_malanga_Ecuador_desconocido",
        "cita": "Pelaez Ramirez JM. Repositorio UTE Ecuador. Manejo del cultivo de malanga en Ecuador. La malanga es un cultivo todavia desconocido por la mayoria de ecuatorianos. Guia de manejo y produccion.",
        "url": "https://repositorio.ute.edu.ec/bitstreams/download/pelaez-ramirez-manejo-malanga-ecuador.pdf"
    },
    {
        "archivo": "UDLA_2013_AlarconMoyano_exportacion_malanga_Ecuador_calidad",
        "cita": "Alarcon Moyano JK (2013). Exportacion de malanga desde Ecuador. Ecuador exporta malanga sin proceso, tubérculo de mejor calidad. Proceso: cosecha, limpieza, clasificacion y enceramiento. UDLA. PDF.",
        "url": "https://dspace.udla.edu.ec/bitstream/alarcon-moyano-exportacion-malanga-ecuador-2013.pdf"
    },
    {
        "archivo": "UDLA_2010_OrtizDelgado_malanga_blanca_Ecuador_cultivo_agricultores",
        "cita": "Ortiz Delgado GF (2010). El cultivo de la malanga blanca en Ecuador. Tubérculo cultivado por ciertos agricultores locales desde antes de la expansion comercial. UDLA. PDF.",
        "url": "https://dspace.udla.edu.ec/bitstream/UDLA-EC-TLNI-2010-02.pdf"
    },
    {
        "archivo": "ElProductor_2021_Ecuador_primer_exportador_malanga_EEUU_4000ha",
        "cita": "El Productor Ecuador (2021). Ecuador primer exportador de malanga a EE.UU. Promedio de 4.000 a 5.000 hectareas. Exportan aproximadamente 1.500 contenedores al año de produccion de malanga.",
        "url": "https://elproductor.com/2021/02/ecuador-primer-exportador-de-malanga-a-ee-uu/"
    },
    {
        "archivo": "FPS_Sinaloa_paquete_tecnologico_malanga_trips_mosca_blanca",
        "cita": "Fundacion Produce Sinaloa Mexico. Paquete tecnologico para el establecimiento de malanga. Plagas en cultivo de malanga: trips y mosca blanca. Los trips causaron severos danos en las hojas. PDF.",
        "url": "https://www.fps.org.mx/category/35-otros/paquete-tecnologico-malanga.pdf"
    },
    # =====================================================================
    # CACAO - CAPTURA DE CARBONO Y SERVICIOS ECOSISTÉMICOS
    # =====================================================================
    {
        "archivo": "ESPAM_2025_captura_carbono_agroforestal_cacao_mitigacion_cambio_climatico",
        "cita": "ESPAM MFL Ecuador (22 jul 2025). Captura de carbono en sistema agroforestal de cacao (Theobroma cacao L.) como medida de mitigacion del cambio climatico. Repositorio ESPAM.",
        "url": "https://repositorio.espam.edu.ec/items/captura-carbono-agroforestal-cacao-mitigacion-espam-2025"
    },
    {
        "archivo": "PoloConocimiento_carbono_suelo_cacao_agroforestal_13_8_Mg_ha",
        "cita": "Polo del Conocimiento. Captura de carbono en suelo de cultivo de cacao. En plantaciones de cacao el C puede almacenar hasta 13,8 Mg C ha-1. Sistemas agroforestales vs monocultivos de cacao.",
        "url": "https://mail.polodelconocimiento.com/ojs/index.php/es/article/view/carbono-suelo-cacao-agroforestal"
    },
    {
        "archivo": "ResearchGate_2026_captura_carbono_cacao_joven_adulto_tasa_fijacion",
        "cita": "ResearchGate (28 mar 2026). Captura de carbono en cacao (Theobroma cacao L.). Cacao joven: 54.098,53 t carbono. Cacao adulto: 1.360.125,00 t. Tasa de fijacion: 27.049,26 t/ha.",
        "url": "https://www.researchgate.net/publication/captura-carbono-cacao-theobroma-joven-adulto-2026"
    },
    {
        "archivo": "SciELO_CR_2021_MenaMosquera_emisiones_carbono_bosques_cacao_Colombia",
        "cita": "Mena-Mosquera VE et al. (2021). Potencial de reduccion de emisiones y captura de carbono en bosques y sistemas agroforestales con cacao en el Choco colombiano. SciELO Costa Rica.",
        "url": "http://www.scielo.sa.cr/scielo.php?script=sci_arttext&pid=S1659-24682021000100001"
    },
    {
        "archivo": "CATIE_repositorio_proyecto_carbono_agroforestales_indigenas_cacao",
        "cita": "Repositorio CATIE. Proyecto de captura de carbono y desarrollo de mercados ambientales en sistemas agroforestales indigenas con cacao. Asociacion Comision de Mujeres y participacion comunitaria.",
        "url": "https://repositorio.catie.ac.cr/handle/proyecto-captura-carbono-mercados-ambientales-agroforestales-cacao"
    },
    {
        "archivo": "Chapingo_repositorio_captura_emision_GEI_agroforestales_cacao_linea_base",
        "cita": "Repositorio Chapingo Mexico. Contribucion al estudio de captura y emision de gases de efecto invernadero en sistemas agroforestales de cacao. Estimaciones para construir linea base de GEI.",
        "url": "https://repositorio.chapingo.edu.mx/items/captura-emision-gases-efecto-invernadero-agroforestales-cacao"
    },
    {
        "archivo": "Redalyc_2016_Pocomucha_carbono_cacaotales_131_18_t_ha",
        "cita": "Pocomucha VS et al. (2016). Analisis socio-economico y carbono en sistemas agroforestales de cacao. Valor promedio total 131,18 t C ha-1 (65,61 biomasa aerea + 65,57 componente suelo). Redalyc.",
        "url": "https://www.redalyc.org/journal/analisis-socioeconomico-carbono-cacaotales-pocomucha-2016"
    },
    {
        "archivo": "LukerChocolate_accion_climatica_cacao_descarbonizacion_impacto",
        "cita": "Luker Chocolate. Accion climatica en el cacao. Reduccion a cero mediante descarbonizacion, evaluacion del impacto del cacao en el carbono y estrategias de sostenibilidad en la cadena del cacao.",
        "url": "https://lukerchocolate.com/es/accion-climatica-cacao/"
    },
    # =====================================================================
    # BANANO / PLÁTANO - CAPTURA DE CARBONO Y HUELLA CLIMÁTICA
    # =====================================================================
    {
        "archivo": "FAO_huella_carbono_cadena_suministro_banano_produccion_empaque",
        "cita": "FAO. Huella de carbono de la cadena de suministro del banano. Tres grandes pasos: produccion y empaque, transporte y distribucion, consumo final. Impacto climatico del sector bananero.",
        "url": "https://www.fao.org/sustainability/good-practices/carbon-footprint/banana/es/"
    },
    {
        "archivo": "DiarioCorreo_Ecuador_2021_banano_captura_9_6_millones_ton_CO2",
        "cita": "Diario Correo Ecuador (14 sept 2021). Banano: bonos por captura de carbono. Ecuador limpia de la atmosfera un promedio de 9,6 millones de toneladas anuales de CO2 con sus plantaciones bananeras.",
        "url": "https://diariocorreo.com.ec/opinion/banano-bonos-por-captura-de-carbono/"
    },
    {
        "archivo": "UTMachala_almacenamiento_carbono_banano_organico_suelo_Elaeis",
        "cita": "Universidad Tecnica de Machala. Almacenamiento de carbono en banano organico en el sitio pal. Cuantificacion de captura de carbono en suelo cultivado con banano variedad filipino tipo organico.",
        "url": "https://repositorio.utmachala.edu.ec/items/almacenamiento-carbono-banano-organico-sitio-pal"
    },
    {
        "archivo": "REDI_CEDIA_Ecuador_carbono_banano_organico_suelo_uso_anterior",
        "cita": "Red de Investigadores Ecuatorianos REDI CEDIA. Almacenamiento de carbono en banano organico en el sitio pal. Comparacion con suelo de uso anterior. Investigacion ecuatoriana.",
        "url": "https://redi.cedia.edu.ec/document/almacenamiento-carbono-banano-organico-sitio-pal"
    },
    {
        "archivo": "CATIE_valoracion_biofisica_carbono_cacao_banano_platano_bosque",
        "cita": "Repositorio CATIE. Valoracion biofisica y financiera de la fijacion de carbono en cinco usos del suelo: cacaotales con arboles, bananales con arboles, platano monocultivo, charrales y bosques.",
        "url": "https://repositorio.catie.ac.cr/bitstream/handle/valoracion-biofisica-fijacion-carbono-cacao-banano-platano.pdf"
    },
    {
        "archivo": "Dialnet_2020_Agudelo_captura_carbono_biomasa_sistemas_uso_suelo",
        "cita": "Agudelo BNC et al. (2020). Captura de carbono en biomasa de sistemas de uso del suelo. Bosque galeria y macroforestales con mayor carbono; SAF con platano almaceno menor cantidad. Dialnet. PDF.",
        "url": "https://dialnet.unirioja.es/descarga/articulo/captura-carbono-biomasa-sistemas-uso-suelo-agudelo-2020.pdf"
    },
    {
        "archivo": "RevistasUNAS_2025_Cordova_carbono_agroecosistemas_platano_servicios",
        "cita": "Cordova MNC et al. (2025). Almacenamiento de carbono en tres agroecosistemas del cultivo de platano y evaluacion de servicios ecosistemicos. Revistas UNAS Peru.",
        "url": "https://revistas.unas.edu.pe/revia/article/view/almacenamiento-carbono-agroecosistemas-platano-cordova-2025"
    },
    {
        "archivo": "sinCarbono_2023_agricultura_inteligente_huella_carbono_platano_banano",
        "cita": "sinCarbono (8 jun 2023). La agricultura inteligente para reducir la huella de carbono. Huella de carbono del platano menor que guisantes; mucho menor que la huella de carbono de la carne.",
        "url": "https://sincarbono.io/la-agricultura-inteligente-para-reducir-la-huella-de-carbono/"
    },
    # =====================================================================
    # LIMÓN SUTIL (Citrus aurantifolia) - ECUADOR
    # =====================================================================
    {
        "archivo": "UNESUM_2023_Campozano_limon_sutil_cultivo_Portoviejo_73p",
        "cita": "Campozano Parrales J (2023). Cultivo de limon sutil (Citrus limon) en Portoviejo, Ecuador. El limon es un cultivo muy importante en la localidad de Portoviejo debido a su extension economica. UNESUM. PDF 73 paginas.",
        "url": "https://repositorio.unesum.edu.ec/bitstream/campozano-parrales-limon-sutil-citrus-limon-unesum-2023.pdf"
    },
    {
        "archivo": "ULEAM_2009_BermudezPisco_cadena_productiva_limon_sutil_Manabi",
        "cita": "Bermudez Pisco AF (2009). Mejoramiento de la cadena productiva y comercializacion del limon sutil (Citrus aurantifolia) en Manabi, Ecuador. Repositorio ULEAM.",
        "url": "https://repositorio.uleam.edu.ec/handle/bermudez-pisco-cadena-productiva-limon-sutil-manabi-2009"
    },
    {
        "archivo": "UTN_2011_limon_sutil_Manabi_fuente_ingreso_economico_142p",
        "cita": "Universidad Tecnica del Norte (2 ene 2011). Cultivo del limon sutil en la zona de Manabi es una de las principales fuentes de ingreso economico segun Gomez 2005. Repositorio Digital UTN. PDF 142 paginas.",
        "url": "https://repositorio.utn.edu.ec/bitstream/limon-sutil-manabi-fuente-ingreso-economico-utn-2011.pdf"
    },
    {
        "archivo": "ResearchGate_2026_caracterizacion_fincas_limon_Santa_Elena_sustentabilidad",
        "cita": "ResearchGate (23 feb 2026). Caracterizacion de fincas productoras de limon. Sustentabilidad del cultivo de limon en la provincia de Santa Elena, Ecuador. Tesis Doctoral Lima Peru UNALM.",
        "url": "https://www.researchgate.net/publication/347782700"
    },
    {
        "archivo": "ESPOL_2009_PinoMantilla_prefactibilidad_produccion_limon_sutil_Ecuador",
        "cita": "Pino Mantilla C (2009). Estudio de prefactibilidad para la produccion de limon en Ecuador. En Ecuador solo se producen dos variedades: limon sutil y limon Tahiti. DSpace ESPOL.",
        "url": "https://www.dspace.espol.edu.ec/bitstream/pino-mantilla-prefactibilidad-produccion-limon-sutil-espol-2009.pdf"
    },
    {
        "archivo": "UPSE_2010_SolisLucas_NPK_produccion_Citrus_aurantifolia_Ecuador",
        "cita": "Solis Lucas LA (2010). Efecto de NPK en la produccion de Citrus aurantifolia swingle (limon sutil) en Ecuador. En 2001 Ecuador exporto mas de 9000 toneladas. Repositorio UPSE.",
        "url": "https://repositorio.upse.edu.ec/items/solis-lucas-NPK-produccion-citrus-aurantifolia-upse-2010"
    },
    {
        "archivo": "SciELO_Chile_2020_Valarezo_sustentabilidad_fincas_limon_Portoviejo_4300ha",
        "cita": "Valarezo Beltron CO (2020). Evaluacion de la sustentabilidad de fincas productoras de limon en Ecuador. El limon es cultivo importante en la zona con 4.300 hectareas. SciELO Chile.",
        "url": "https://www.scielo.cl/scielo.php?script=sci_arttext&pid=valarezo-beltron-sustentabilidad-fincas-limon-2020"
    },
    {
        "archivo": "Dialnet_2020_Valarezo_fincas_limon_Portoviejo_area_extensa_concentrada",
        "cita": "Valarezo-Beltron O (2020). Caracterizacion de fincas productoras de limon (Citrus aurantifolia) en Portoviejo Ecuador. Area extensa y concentrada de produccion. Dialnet.",
        "url": "https://dialnet.unirioja.es/servlet/articulo?codigo=valarezo-beltron-caracterizacion-fincas-limon-portoviejo-2020"
    },
    {
        "archivo": "FAOAGRIS_2023_Beltron_dinamica_poblacional_insectos_plaga_limon_Manabi",
        "cita": "Beltron COV (2023). Dinamica poblacional de insectos plaga del limon sutil en dos zonas agroecologicas de Manabi, Ecuador. FAO AGRIS.",
        "url": "https://agris.fao.org/search/en/providers/records/dinamica-poblacional-insectos-plaga-limon-sutil-manabi-beltron-2023"
    },
    {
        "archivo": "ElComercio_2011_produccion_limon_Ecuador_Manabi_1200ha_historia",
        "cita": "El Comercio Ecuador (18 feb 2011). Cuatro variedades de limon estan de cosecha. Manabi tiene la mayor zona de produccion del citrico en el pais con 1200 hectareas. Fruto introducido al Ecuador en la epoca colonial.",
        "url": "https://www.elcomercio.com/actualidad/negocios/cuatro-variedades-limon-cosecha-ecuador.html"
    },
    {
        "archivo": "RIIARN_UMSA_2023_Beltron_insectos_plaga_limon_4405ha_Ecuador",
        "cita": "Beltron COV (2023). Dinamica poblacional de insectos plaga del limon sutil en Ecuador. Ecuador cultiva limon sutil con 4405 ha en 3257 unidades de produccion agropecuaria. RIIARN UMSA. PDF.",
        "url": "https://riiarn.umsa.bo/RIIARn/article/view/dinamica-poblacional-insectos-plaga-limon-sutil-beltron-2023"
    },
    {
        "archivo": "LaHora_2025_produccion_limon_Ecuador_Manabi_lider_provincias",
        "cita": "Diario La Hora Ecuador (13 nov 2025). El limon vuelve a su precio habitual en mercados. Las provincias con mayor produccion de limon son Manabi (lider), El Oro, Carchi, Pichincha, Imbabura y Guayas.",
        "url": "https://www.lahora.com.ec/los-rios/exportaciones/limon-precio-habitual-mercados-tiendas-ecuador-provincias.html"
    },
    {
        "archivo": "UPS_2010_Llumiquinga_limon_sutil_exportacion_Tahiti_Ecuador_201p",
        "cita": "Llumiquinga Suntaxi JL (2010). Limon sutil para consumo local y limon Tahiti para exportacion en Ecuador. En 2001 Ecuador exporto mas de 9000 toneladas. UPS Quito. PDF 201 paginas.",
        "url": "https://dspace.ups.edu.ec/UPS-QT02199.pdf"
    },
    {
        "archivo": "UAgraria_nitrato_potasio_limon_comportamiento_agronomico_Ecuador",
        "cita": "Universidad Agraria Ecuador. Aplicacion de nitrato de potasio en cultivo de limon: optimo comportamiento agronomico en numero de frutos. Inductores de florescencia en limon sutil. PDF 59 paginas.",
        "url": "https://cia.uagraria.edu.ec/Archivos/nitrato-potasio-limon-comportamiento-agronomico-uagraria.pdf"
    },
    {
        "archivo": "UCSG_mercado_prefactibilidad_limon_sutil_Tahiti_Ecuador",
        "cita": "Repositorio UCSG. Estudio de mercado y prefactibilidad del cultivo del limon en Ecuador. Limon sutil para consumo local y Tahiti para exportacion. Importancia significativa del limon en Ecuador.",
        "url": "http://repositorio.ucsg.edu.ec/handle/mercado-prefactibilidad-limon-sutil-tahiti-ecuador-ucsg"
    },
    {
        "archivo": "UNESUM_2024_ReyesGarcia_insectos_chupadores_piojo_blanco_limon_Jipijapa",
        "cita": "Reyes Garcia KD (2024). Cultivo de limon en Joa Jipijapa: insectos chupadores, piojo blanco (Unaspis citri) y escama. Desafios fitosanitarios en la produccion de limon sutil en Manabi. UNESUM. PDF.",
        "url": "https://repositorio.unesum.edu.ec/bitstream/reyes-garcia-insectos-chupadores-piojo-blanco-limon-jipijapa-2024.pdf"
    },
    {
        "archivo": "UPSE_2024_MateoLimones_nutricion_integral_limon_sutil_Ecuador",
        "cita": "Mateo Limones JC (2024). Nutricion integral del limon sutil (Citrus aurantifolia) en Ecuador. Limon sutil es la especie mas cultivada seguida del Tahiti; sutil para consumo local. Repositorio UPSE. PDF.",
        "url": "https://repositorio.upse.edu.ec/download/mateo-limones-nutricion-integral-limon-sutil-ecuador-2024.pdf"
    },
    {
        "archivo": "UAzuay_2023_GarcesVillacis_limon_sutil_produccion_anual_Ecuador",
        "cita": "Garces Villacis LA (2023). El limon sutil en Ecuador se aprovecha todo el año, produccion decae solo en epoca seca. Ventaja competitiva del sector limonero ecuatoriano. UAzuay. PDF.",
        "url": "https://dspace.uazuay.edu.ec/bitstream/datos/garces-villacis-limon-sutil-produccion-anual-ecuador-2023.pdf"
    },
    {
        "archivo": "ALICIA_Concytec_NK_limon_sutil_Citrus_aurantifolia_Santa_Elena",
        "cita": "ALICIA Concytec. Niveles crecientes de N y K en el cultivo de limon sutil (Citrus aurantifolia Swingle) en Santa Elena Ecuador. Efecto de fertilizacion nitrogenada y potasica en produccion.",
        "url": "https://alicia.concytec.gob.pe/vufind/Record/NK-limon-sutil-citrus-aurantifolia-santa-elena"
    },
    {
        "archivo": "UAgraria_2024_propagacion_limon_sutil_Ecuador_consumo_80_porciento",
        "cita": "Universidad Agraria Ecuador (10 may 2024). Propagacion de planta de limon sutil. El limon es consumido en 80% dentro del pais. Gran acogida del cultivo de limon en Ecuador. PDF.",
        "url": "https://cia.uagraria.edu.ec/Archivos/propagacion-planta-limon-sutil-uagraria-2024.pdf"
    },
    {
        "archivo": "ResearchGate_2026_comportamiento_cultivo_limon_Citrus_aurantifolia_4400ha",
        "cita": "ResearchGate (23 abr 2026). Comportamiento del cultivo del limon (Citrus aurantifolia Swingle) en Ecuador. El limon sutil es la especie de citrico mas cultivada en Ecuador; ambos suman aproximadamente 4400 ha.",
        "url": "https://www.researchgate.net/publication/comportamiento-cultivo-limon-citrus-aurantifolia-swingle-ecuador-2026"
    },
    {
        "archivo": "UNESUM_2024_Estupinan_laminas_riego_limon_sutil_Colonche_52p",
        "cita": "Estupinan Miraba OA (2024). Efecto de cuatro laminas de riego en la produccion de limon sutil (Citrus aurantifolia) en el sector La Ponga, parroquia Colonche. UNESUM. PDF 52 paginas.",
        "url": "https://repositorio.unesum.edu.ec/bitstream/estupinan-miraba-laminas-riego-limon-sutil-colonche-2024.pdf"
    },
    {
        "archivo": "LaReferencia_2016_Santistevan_comportamiento_limon_Citrus_aurantifolia",
        "cita": "Santistevan Mendez M (2016). Comportamiento del cultivo de limon (Citrus aurantifolia Swingle) en Ecuador. Investigacion agosto-diciembre 2015. LA Referencia repositorio.",
        "url": "https://www.lareferencia.info/vufind/Record/santistevan-mendez-comportamiento-limon-citrus-aurantifolia-2016"
    },
    {
        "archivo": "Dialnet_2021_Bustamante_entorno_economico_competitividad_limon_Ecuador",
        "cita": "Bustamante RYS (2021). Entorno economico y niveles de competitividad del limon en Ecuador. Limon cultivable en suelos arcillosos hasta 40 grados. Dialnet. PDF.",
        "url": "https://dialnet.unirioja.es/descarga/articulo/bustamante-entorno-economico-competitividad-limon-ecuador-2021.pdf"
    },
]

# =====================================================================
# GUARDAR ARCHIVOS
# =====================================================================
CARPETA = os.path.dirname(os.path.abspath(__file__))
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

creados = 0
errores = 0

for ref in REFERENCIAS:
    ruta = os.path.join(CARPETA, ref["archivo"] + ".txt")
    contenido_web = ""

    if ref["url"]:
        try:
            r = requests.get(ref["url"], headers=HEADERS, timeout=15)
            r.raise_for_status()
            # Ignorar PDFs (solo guardar la URL)
            if "pdf" in r.headers.get("Content-Type", "").lower() or ref["url"].endswith(".pdf"):
                contenido_web = "[Documento PDF — acceder directamente en la URL]"
            else:
                soup = BeautifulSoup(r.text, "html.parser")
                # Extraer parrafos principales
                parrafos = [p.get_text(strip=True) for p in soup.find_all("p") if len(p.get_text(strip=True)) > 60]
                contenido_web = "\n\n".join(parrafos[:10]) if parrafos else "[Sin contenido textual extraible]"
        except Exception as e:
            contenido_web = f"[No se pudo acceder: {e}]"
    else:
        contenido_web = "[Sin URL disponible — referencia de libro o tesis sin acceso en linea]"

    texto = f"""REFERENCIA BIBLIOGRAFICA
========================
{ref['cita']}

URL: {ref['url'] if ref['url'] else 'No disponible'}

CONTENIDO PRINCIPAL
===================
{contenido_web}
"""
    with open(ruta, "w", encoding="utf-8") as f:
        f.write(texto)

    print(f"[OK] {ref['archivo']}.txt")
    creados += 1

print(f"\n[LISTO] {creados} archivos creados en: {CARPETA}")

