# -*- coding: utf-8 -*-
"""
MELANT IA — Extractor de información veterinaria / pecuaria
============================================================
Lee las URLs de descargar_fotos.py correspondientes a:
  • Cerdos / Porcicultura
  • Ganado Bovino
  • Cabras / Caprinos
  • Aves de corral / Pollos / Gallinas
  • Cría de Cuyes / Cobayos

Para cada URL accesible:
  1. Descarga y resume el contenido principal de la página.
  2. Guarda un archivo .md individual con nombre descriptivo.
  3. Construye un JSON listo para fusionar en asistente_veterinario.json.

Salida:
  MELANTIA_DATASET/Fichas_veterinarias/<categoria>/<nombre_descriptivo>.md
  MELANTIA_DATASET/Fichas_veterinarias/asistente_veterinario_ampliado.json
"""
import os
import sys
import json
import re
import time
import subprocess

# ── Instalación automática de dependencias ─────────────────────────────────────
def _instalar(pkg):
    subprocess.check_call([sys.executable, "-m", "pip", "install", pkg, "--quiet"])

try:
    import requests
except ImportError:
    _instalar("requests"); import requests

try:
    from bs4 import BeautifulSoup
except ImportError:
    _instalar("beautifulsoup4"); from bs4 import BeautifulSoup

# ── Rutas de salida ────────────────────────────────────────────────────────────
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
BASE_OUT     = os.path.join(SCRIPT_DIR, "..", "Fichas_veterinarias")
JSON_DEST    = os.path.join(
    SCRIPT_DIR, "..", "..", "melant_ia", "src", "knowledge_seeds",
    "asistente_veterinario.json"
)
JSON_AMPLIADO = os.path.join(BASE_OUT, "asistente_veterinario_ampliado.json")

# ── Categorías y palabras clave ────────────────────────────────────────────────
CATEGORIAS = {
    "cerdos": [
        "cerdo", "porcin", "porcicol", "cerda", "cochino",
        "iberico", "piara", "lechon", "swine", "pork"
    ],
    "ganado_bovino": [
        "bovino", "vacuno", "ganadero", "ganado", "hato",
        "bovina", "res_", "vaca", "toro", "ternero", "lechera", "leche_"
    ],
    "cabras": [
        "cabra", "caprino", "caprina", "caprinos", "ovino",
        "oveja", "rumiante", "goat"
    ],
    "aves": [
        "ave_", "aves_", "pollo", "gallina", "avicol", "avicultur",
        "ponedor", "engorde", "broiler", "traspatio", "galpon",
        "pastoreo_gall", "libre_pastoreo"
    ],
    "cuyes": [
        "cuy", "cobayo", "cobayos", "cavia", "cuyera",
        "guinea_pig", "crias_cuy"
    ],
}

# ── Lista completa de referencias (extraídas de descargar_fotos.py) ────────────
# Se incluyen SOLO las relacionadas con las categorías anteriores.
REFERENCIAS = [
    # ── AVES / POLLOS / GALLINAS ──────────────────────────────────────────────
    {"archivo": "Andrade-Yucailla_2017_pollos_camperos_Ecuador",
     "cita": "Andrade-Yucailla et al. (2017). Comportamiento productivo de dos fenotipos de pollos camperos en la region Amazonica de Ecuador.",
     "url": "https://doi.org/10.59410/RACYT-v06n01ep01-0075"},
    {"archivo": "Angarita_Castrillon_2020_gallinas_criollas",
     "cita": "Angarita, L., y Castrillon, Z. (2020). Produccion agroecologica de gallinas criollas. Corporacion Universitaria Minuto de Dios.",
     "url": "https://semillas.org.co/apc-aa-files/5d99b14191c59782eab3da99d8f95126/sin-prueba_compressed-1.pdf"},
    {"archivo": "Estevez_2007_density_broilers",
     "cita": "Estevez, I. (2007). Density Allowances for Broilers: Where to Set the Limits? Poultry Science, 86(6).",
     "url": "https://doi.org/10.1093/ps/86.6.1265"},
    {"archivo": "FAO_2015_integrated_backyard_systems",
     "cita": "FAO. (2015). Integrated backyard systems.",
     "url": "https://www.fao.org/agriculture/animal-production-and-health/en/"},
    {"archivo": "Gallard_2022_densidad_alojamiento_bienestar_parrilleros",
     "cita": "Gallard et al. (2022). Efecto de la densidad de alojamiento sobre bienestar en pollos parrilleros.",
     "url": "https://doi.org/10.30972/vet.3326188"},
    {"archivo": "Hernandez-Cabrera_2015_pastoreo_gallinas_malezas",
     "cita": "Hernandez-Cabrera, C. (2015). Efecto del pastoreo de gallinas en el control de malezas. Zamorano.",
     "url": "https://bdigital.zamorano.edu/server/api/core/bitstreams/3a84a03d-8725-4ccf-acfa-cdcab82a3a8e/content"},
    {"archivo": "Jaramillo_2018_parametros_productivos_huevo",
     "cita": "Jaramillo et al. (2018). Evaluacion de parametros productivos y calidad del huevo en dos sistemas de alojamiento.",
     "url": "https://hdl.handle.net/11404/5291"},
    {"archivo": "Phillips_Engel_2002_agroforestry_chicken",
     "cita": "Phillips, I., y Engel, C. (2002). Development of an agroforestry system for chicken production.",
     "url": "https://orgprints.org/id/eprint/8417/"},
    {"archivo": "FENAVI_2019_sanidad_industria_avicola",
     "cita": "FENAVI (2019). Sanidad en la industria avicola. Enfermedades por zona geografica y nivel de bioseguridad.",
     "url": "https://fenavi.org/uploads/2019/02/SANIDAD-EN-LA-INDUSTRIA-AVICOLA.pdf"},
    {"archivo": "Avinews_2025_protocolos_bioseguridad_pollos_engorde",
     "cita": "Avinews (2025). Protocolos de bioseguridad en el manejo de pollos de engorde.",
     "url": "https://avinews.com/protocolos-de-bioseguridad-en-el-manejo-de-pollos-de-engorde/"},
    {"archivo": "Agrocalidad_2023_manual_buenas_practicas_pollos_engorde",
     "cita": "Agrocalidad (2023). Manual de Buenas Practicas de Produccion Avicola – Pollos de engorde.",
     "url": "https://www.agrocalidad.gob.ec/wp-content/uploads/2023/02/Manual-de-Aplicabilidad-de-Buenas-Practicas-Pollos-de-Engorde.pdf"},
    {"archivo": "Aviagen_manual_manejo_pollos_engorde",
     "cita": "Aviagen. Manual de Manejo de Pollos de Engorde. Temperatura, ventilacion y bienestar animal.",
     "url": "https://aviagen.com/assets/Tech_Center/Broiler_Management/2022-BB-BroilerPOGuide-Spanish.pdf"},
    {"archivo": "CertifiedHumane_2025_enfermedades_pollos_engorde",
     "cita": "Certified Humane Latino (2025). Como prevenir las enfermedades que afectan a los pollos de engorde.",
     "url": "https://certifiedhumanelatino.com/como-prevenir-las-enfermedades-que-afectan-a-los-pollos-de-engorde/"},
    {"archivo": "MerckVetManual_2024_programas_vacunacion_aves_produccion",
     "cita": "Merck Veterinary Manual (2024). Programas de vacunacion para aves de produccion.",
     "url": "https://www.msdvetmanual.com/es/aves-de-corral/vacunacion-de-aves-de-corral/programas-de-vacunacion-para-aves-de-produccion"},
    {"archivo": "Zoomalia_2024_limpieza_gallinero_9_consejos",
     "cita": "Zoomalia (2024). Limpieza del gallinero: 9 consejos para un buen mantenimiento.",
     "url": "https://www.zoomalia.es/blog/limpieza-gallinero/"},
    {"archivo": "Agrocalidad_2020_guia_buenas_practicas_avicolas",
     "cita": "Agrocalidad (2020). Guia de buenas practicas avicolas. Temperatura, luz, ventilacion, limpieza y sanitizacion.",
     "url": "https://www.agrocalidad.gob.ec/wp-content/uploads/2020/05/pecu-guia-buenas-practicas-avicolas.pdf"},
    {"archivo": "Terranimal_2023_bienestar_gallinas_ponedoras_libre_pastoreo",
     "cita": "Terranimal Ecuador (2023). Bienestar Animal de Gallinas Ponedoras en Libre Pastoreo.",
     "url": "https://gallinasfelices.terranimal.ec/wp-content/uploads/2023/07/Terranimal-Bienestar-Animal-Gallinas-Ponedoras-Libre-Pastoreo.pdf"},
    {"archivo": "AmericanHumane_2025_normas_bienestar_gallinas_ponedoras",
     "cita": "American Humane Society (2025). Normas de bienestar animal para gallinas ponedoras.",
     "url": "https://www.americanhumane.org/wp-content/uploads/2025/03/American-Humane-Laying-Hen-Standards.pdf"},
    {"archivo": "PazyDesarrollo_2020_manual_produccion_manejo_aves",
     "cita": "Paz y Desarrollo (2020). Manual Practico para la Produccion y Manejo de Aves.",
     "url": "https://www.pazydesarrollo.org/wp-content/uploads/2020/09/Manual-practico-produccion-manejo-aves.pdf"},
    {"archivo": "UAE_2025_enfermedades_respiratorias_aves_traspatio",
     "cita": "Universidad Agraria del Ecuador (2025). Enfermedades respiratorias en aves de traspatio.",
     "url": "https://cia.uagraria.edu.ec/Archivos/ENFERMEDADES-RESPIRATORIAS-AVES-TRASPATIO.pdf"},
    {"archivo": "Avinews_2026_sanidad_procesamiento_avicola_inocuidad",
     "cita": "Avinews (2026). Sanidad en el procesamiento avicola: clave para la inocuidad alimentaria.",
     "url": "https://avinews.com/sanidad-en-el-procesamiento-avicola-clave-para-la-inocuidad-alimentaria/"},
    {"archivo": "AgroProductividad_libre_pecoreo_gallinas_Gallus",
     "cita": "Revista Agro Productividad. El sistema de libre pecoreo en gallinas Gallus domesticus.",
     "url": "https://revista-agroproductividad.org/index.php/agrop/article/download/1978/1763"},
    {"archivo": "WATTPoultry_2016_gallinas_libres_riesgos_sanidad_aviar",
     "cita": "WATT Poultry (2016). Gallinas libres y los riesgos para la sanidad aviar.",
     "url": "https://www.wattagnet.com/egg-production/article/15527946/gallinas-libres-y-los-riesgos-para-la-sanidad-aviar"},
    {"archivo": "Terranimal_alternativas_crianza_libre_pastoreo_sistemas",
     "cita": "Terranimal Ecuador. Alternativas de Crianza en Libre Pastoreo.",
     "url": "https://gallinasfelices.terranimal.ec/gallina/alternativas-crianza-libre-pastoreo/"},
    {"archivo": "PAE_gallinas_libres_Ecuador_inanicion_prohibida",
     "cita": "Proteccion Animal Ecuador (PAE). Gallinas Libres Ecuador.",
     "url": "https://pae.ec/campanas/gallinas-libres-ecuador/"},
    {"archivo": "VeterinarioDigital_2020_produccion_huevo_libre_jaula_tipos",
     "cita": "Veterinaria Digital (2020). Produccion de huevo libre de jaula.",
     "url": "https://www.veterinariadigital.com/articulos/produccion-huevo-libre-de-jaula/"},
    {"archivo": "GranjaElMotilon_2024_gallinas_libres_crianza_bienestar",
     "cita": "Granja El Motilon (2024). Gallinas Libres: crianza eficiente al libre pastoreo.",
     "url": "https://granjaelmotilon.com/blog/gallinas-libres-crianza-eficiente-al-libre-pastoreo/"},
    {"archivo": "ElProductor_2021_factibilidad_huevos_gallinas_pastoreo_Ecuador",
     "cita": "El Productor Ecuador (2021). Factibilidad de la produccion de huevos de gallinas con acceso a pastoreo.",
     "url": "https://elproductor.com/2021/07/factibilidad-de-la-produccion-de-huevos-de-gallinas-con-acceso-a-pastoreo/"},
    # ── CERDOS / PORCICULTURA ─────────────────────────────────────────────────
    {"archivo": "CIAP_manual_produccion_porcicola",
     "cita": "Centro de Informacion de Actividades Porcinas. Manual de produccion porcicola. 114 paginas.",
     "url": "https://www.ciap.org.ar/Sitio/Archivos/Manual%20de%20produccion%20porcicola.pdf"},
    {"archivo": "Corpmontana_2023_reproduccion_cerdos",
     "cita": "Corpmontana (2023). Reproduccion de cerdos: guia completa.",
     "url": "https://www.corpmontana.com/m-conecta/porcicultura/"},
    {"archivo": "3tres3_sistema_produccion_sitio_multiple_cerdos",
     "cita": "3tres3.com. Sistema de produccion en un sitio y en multiples sitios.",
     "url": "https://www.3tres3.com/latam/articulos/sistema-de-produccion-en-un-sitio-y-en-multiples-sitios_36533/"},
    {"archivo": "Agrotendencia_cria_cerdos_potreros",
     "cita": "Agrotendencia.tv. Cria de cerdos: manejo en potreros, instalaciones y ventajas.",
     "url": "https://agrotendencia.tv/agropedia/la-cria-de-cerdos/"},
    {"archivo": "Digesa_guia_crianza_sanitaria_cerdos",
     "cita": "Digesa - MINSA Peru. Guia Para La Crianza Sanitaria de Cerdos. 24 paginas.",
     "url": "https://www.digesa.minsa.gob.pe/publicaciones/descargas/crianza_cerdos.pdf"},
    {"archivo": "Asobanca_2022_guia_granja_cerdos_Ecuador",
     "cita": "Asociacion de Bancos Privados del Ecuador (2022). Guia de Granja de Cerdos. 62 paginas.",
     "url": "https://asobanca.org.ec/uploads/2022/12/1.-Gu%C3%ADa-de-Granja-de-Cerdos.pdf"},
    {"archivo": "GranjasSanAntonio_2023_proceso_productivo_cerdos",
     "cita": "Granjas San Antonio (2023). El proceso productivo en una granja de cerdos ecologicos.",
     "url": "https://granjassanantonio.com/el-proceso-productivo-en-una-granja-de-cerdos-ecologicos/"},
    {"archivo": "DehesaBaronDeLey_2021_fases_crianza_cerdo_iberico",
     "cita": "Dehesa Baron De Ley (2021). El cerdo iberico: fases de su crianza.",
     "url": "https://www.dehesabarondeley.com/el-cerdo-iberico-conoces-las-fases-de-su-crianza/"},
    {"archivo": "ProduccionAnimal_manejo_produccion_porcino",
     "cita": "Produccion-animal.com.ar. Manejo y produccion de porcino.",
     "url": "http://www.produccion-animal.com.ar/produccion_porcina/00-produccion_porcina_indice.htm"},
    {"archivo": "EscuelaCortadores_ciclo_vida_cerdo",
     "cita": "Escuela Nacional de Cortadores de Jamon de Espana. El ciclo de vida natural del cerdo.",
     "url": "https://www.escuelanacionalcortadores.es/el-ciclo-de-vida-natural-del-cerdo/"},
    {"archivo": "INIAP_produccion_porcina_Ecuador_distribucion",
     "cita": "INIAP. La produccion porcina en el Ecuador: distribucion regional.",
     "url": "https://repositorio.iniap.gob.ec/bitstream/41000/6183/1/iniapsc377.pdf"},
    {"archivo": "Cayambe-Padilla_2022_sistemas_manejo_porcino_SciELO",
     "cita": "Cayambe-Padilla, M.A. et al. (2022). Sistemas de manejo de la produccion porcina. SciELO Venezuela.",
     "url": "http://ve.scielo.org/scielo.php?script=sci_arttext&pid=S1315-01402022000100001"},
    {"archivo": "MAGAP_2024_Ecuador_exporta_carne_cerdo",
     "cita": "MAGAP (2024). Ecuador exporta por segunda vez carne de cerdo.",
     "url": "https://www.agricultura.gob.ec/ecuador-exporta-por-segunda-vez-carne-de-cerdo/"},
    {"archivo": "Agrocalidad_2022_guia_buenas_practicas_porcicolas",
     "cita": "Agrocalidad (2022). Guia de Buenas Practicas Porcicolas. 72 paginas.",
     "url": "https://www.agrocalidad.gob.ec/wp-content/uploads/2022/02/pecu2-guia-buenas-practicas-porcicolas.pdf"},
    {"archivo": "ESPOCH_2023_porcicultura_manejo_sanitario_genetico",
     "cita": "ESPOCH (2023). Porcicultura: crianza, produccion y reproduccion de cerdos.",
     "url": "https://dspace.espoch.edu.ec/bitstream/123456789/19374/1/23T0785.pdf"},
    {"archivo": "MSDVetManual_interaccion_salud_manejo_cerdos",
     "cita": "MSD Veterinary Manual. Interaccion entre la salud y el manejo en cerdos.",
     "url": "https://www.msdvetmanual.com/es/manejo-y-nutricion/manejo-de-los-cerdos/interaccion-entre-la-salud-y-el-manejo-cerdos"},
    {"archivo": "MundoAgropecuario_2025_agricultura_regenerativa_porcicultura",
     "cita": "Mundo Agropecuario (2025). Agricultura regenerativa y porcicultura: juntas funcionan.",
     "url": "https://mundoagropecuario.com/agricultura-regenerativa-y-porcicultura-juntas-funcionan/"},
    {"archivo": "Garimori_2025_cerdo_iberico_agricultura_regenerativa",
     "cita": "Garimori Guijuelo (2025). La adaptacion del cerdo iberico a la agricultura regenerativa.",
     "url": "https://www.garimori.es/la-adaptacion-del-cerdo-iberico-a-la-agricultura-regenerativa/"},
    {"archivo": "VeterinarioDigital_2022_reproductoras_porcinas_Ecuador",
     "cita": "Veterinaria Digital (2022). Reproductoras porcinas en Ecuador. Razas principales.",
     "url": "https://www.veterinariadigital.com/noticias/reproductoras-porcinas-en-ecuador/"},
    {"archivo": "ASPE_razas_cerdo_Ecuador_Yorkshire_Landrace_Hampshire",
     "cita": "Asociacion de Porcicultores del Ecuador (ASPE). Razas de cerdo en Ecuador.",
     "url": "https://aspe.org.ec/razas-de-cerdo-en-ecuador/"},
    # ── CABRAS / CAPRINOS ─────────────────────────────────────────────────────
    {"archivo": "IGA_caprinocultura_Ecuador",
     "cita": "International Goat Association. La caprinocultura en Ecuador.",
     "url": "https://www.iga-goatworld.com/uploads/tierras_altas_nov_2014.pdf"},
    {"archivo": "MSD_reproduccion_parto_cabras",
     "cita": "MSD Veterinary Manual. Reproduccion y parto de las cabras.",
     "url": "https://www.msdvetmanual.com/es/manejo-y-nutricion/manejo-de-las-cabras/reproduccion-y-parto-de-las-cabras"},
    {"archivo": "Aguirre-Riofrio_2025_rendimiento_canal_cabra_Ecuador",
     "cita": "Aguirre-Riofrio, E.L. (2025). Rendimiento a la canal en la cabra manejada a campo abierto en el sur de Ecuador.",
     "url": "https://revistadigital.uce.edu.ec/index.php/SIEMBRA/article/view/4966"},
    {"archivo": "Sagal_Sosoranga_2025_cabras_criollas_UNESUM",
     "cita": "Sagal Sosoranga, M.N. (2025). Cria de cabras criollas. UNESUM.",
     "url": "https://repositorio.unesum.edu.ec/bitstream/53000/4623/1/UNESUM-ECU-AGROPECUARIA-2025-38.pdf"},
    {"archivo": "UAE_crianza_cabras_tecnificada",
     "cita": "Universidad Agraria del Ecuador. Crianza de cabras bajo procesos tecnificados.",
     "url": "https://cia.uagraria.edu.ec/Archivos/VERA%20MORA%20JONATAN%20SAUL.pdf"},
    {"archivo": "Morales_2025_entorno_social_productivo_caprinos_UTC",
     "cita": "Morales, J.B. (2025). Determinacion del entorno social y productivo de caprinos criollos. UTC.",
     "url": "https://investigacion.utc.edu.ec/dateh/article/view/68"},
    {"archivo": "AICA_2023_produccion_leche_cabras_criollas",
     "cita": "AICA (2023). Produccion de leche de cabras criollas en Ecuador.",
     "url": "https://s59b6fdfe9e4460e7.jimcontent.com/download/version/1687298986/module/14395206073/name/40-PRODUCCION-DE-LECHE-DE-CABRAS-CRIOLLAS-EN-LA.pdf"},
    {"archivo": "Lucas_2020_tipificacion_sistemas_caprinos_UPS",
     "cita": "Lucas, L.A.S. (2020). Tipificacion integral de sistemas caprinos. Universidad Politecnica Salesiana.",
     "url": "https://lagranja.ups.edu.ec/index.php/granja/article/view/31.2020.05"},
    {"archivo": "COVIHER_2023_ganaderia_regenerativa_caprino_ovino",
     "cita": "COVIHER (2023). La Ganaderia Regenerativa en el caprino-ovino.",
     "url": "https://coviher.com/ganaderia-regenerativa-en-el-caprino-ovino/"},
    {"archivo": "ProduccionAnimal_manejo_sanitario_hato_caprino",
     "cita": "Produccion-animal.com.ar. Manejo Sanitario del Hato Caprino.",
     "url": "http://www.produccion-animal.com.ar/produccion_caprina/02-manejo_sanitario_caprino.pdf"},
    {"archivo": "MSDVetManual_manejo_general_cabras",
     "cita": "MSD Veterinary Manual. Manejo general de las cabras.",
     "url": "https://www.msdvetmanual.com/es/manejo-y-nutricion/manejo-de-las-cabras/descripcion-general-del-manejo-de-las-cabras"},
    {"archivo": "MSDVetManual_atencion_sanitaria_preventiva_cabras",
     "cita": "Merck Veterinary Manual. Atencion sanitaria preventiva y vacunacion en cabras.",
     "url": "https://www.merckvetmanual.com/es/manejo-y-nutricion/manejo-de-las-cabras/descripcion-general-de-la-atencion-sanitaria-preventiva-y-programa-de-vacunacion-en-cabras"},
    {"archivo": "Agrocalidad_2025_programa_nacional_sanitario_ovinos_caprinos",
     "cita": "Agrocalidad (2025). Resolucion 0255 – Programa Nacional Sanitario de Ovinos y Caprinos.",
     "url": "https://www.agrocalidad.gob.ec/wp-content/uploads/2025/04/Resolucion-0255-Programa-Nacional-Sanitario-de-ovinos-caprinos.pdf"},
    {"archivo": "MSDVetManual_nutricion_cabras_calcio_fosforo_proteina",
     "cita": "MSD Veterinary Manual. Nutricion de las cabras.",
     "url": "https://www.msdvetmanual.com/es/manejo-y-nutricion/manejo-de-las-cabras/nutricion-de-las-cabras"},
    {"archivo": "SciELO_SENESCYT_caracterizacion_sistemas_caprinos_Ecuador",
     "cita": "Matias, J.V. (2017). Caracterizacion de los sistemas de produccion caprinos en Ecuador.",
     "url": "https://scielo.senescyt.gob.ec/pdf/rctu/1390-9363/rctu.2017.9.1.007.pdf"},
    # ── CUYES / COBAYOS ───────────────────────────────────────────────────────
    {"archivo": "FAO_sanidad_cuyes_cap7_mortalidad_prevencion",
     "cita": "FAO. Capitulo 7: Sanidad en cuyes.",
     "url": "https://www.fao.org/3/w6562s/w6562s09.htm"},
    {"archivo": "FAO_alimentacion_cuyes_agua_suministro",
     "cita": "FAO. Alimentacion de cuyes y conejos. Suministro de agua.",
     "url": "https://www.fao.org/3/w6562s/w6562s10.htm"},
    {"archivo": "Procampo_manejo_sanitario_bioseguridad_cuyes",
     "cita": "Procampo Ecuador. Manejo sanitario y bioseguridad en la explotacion de cuyes.",
     "url": "https://www.procampo.com.ec/blog/11-salud/239-manejo-sanitario-y-bioseguridad-en-la-explotacion-de-cuyes"},
    {"archivo": "Agrocalidad_2022_guia_buenas_practicas_cuyes",
     "cita": "Agrocalidad (2022). Guia de Buenas Practicas Pecuarias en la Produccion de Cuyes. 31 paginas.",
     "url": "https://www.agrocalidad.gob.ec/wp-content/uploads/2022/02/pecu5-guia-buenas-practicas-pecuarias-cuyes.pdf"},
    {"archivo": "HumanaEcuador_2021_manual_manejo_cuyes_forraje",
     "cita": "Fundacion Humana Pueblo a Pueblo Ecuador (2021). Manual de Manejo de Cuyes.",
     "url": "https://humana-ecuador.org/uploads/2021/09/Publicacion-Manual-de-Manejo-de-Cuyes.pdf"},
    {"archivo": "CEDEPAS_manual_tecnico_crianza_cuyes_4_pilares",
     "cita": "CEDEPAS Norte. Manual Tecnico de Crianza de Cuyes: alimentacion, genetica, manejo y sanidad.",
     "url": "https://www.cedepas.org.pe/sites/default/files/manual-tecnico-crianza-cuyes.pdf"},
    {"archivo": "MIDAGRI_manual_bioseguridad_sanidad_cuyes",
     "cita": "MIDAGRI Peru. Manual de bioseguridad y sanidad en cuyes. 90 paginas.",
     "url": "https://repositorio.midagri.gob.pe/bitstream/MIDAGRI/20/1/Huancavelica-Manual-Bioseguridad-Sanidad-Cuyes.pdf"},
    {"archivo": "Procampo_paso_a_paso_cuyera_nutricion",
     "cita": "Procampo Ecuador. Paso a paso para iniciar una cuyera.",
     "url": "https://www.procampo.com.ec/blog/10-nutricion/178-paso-a-paso-para-iniciar-una-cuyera"},
    {"archivo": "ALTROPICO_2022_guia_crianza_cuyes_noroccidente_Ecuador",
     "cita": "Fundacion ALTROPICO (2022). Guia para la Crianza de Cuyes en el noroccidente de Ecuador.",
     "url": "https://altropico.org.ec/uploads/2022/03/2022-guia-crianza-cuyes.pdf"},
    {"archivo": "UPS_2024_modulo_crianza_cuyes_tradicional_tecnificado",
     "cita": "Universidad Politecnica Salesiana (2024). Modulo de crianza de cuyes: sistemas tradicional y tecnificado.",
     "url": "https://dspace.ups.edu.ec/bitstream/123456789/27000/1/UPS-CT011711.pdf"},
    {"archivo": "MAGAP_productores_cuy_kits_manejo_sanitario",
     "cita": "MAGAP Ecuador. Productores de cuy reciben kits para manejo sanitario.",
     "url": "https://www.agricultura.gob.ec/productores-de-cuy-reciben-kits-para-manejo-sanitario/"},
    {"archivo": "UCANR_manual_crianza_produccion_cuyes_pequenos_productores",
     "cita": "UC Agriculture and Natural Resources. Manual de crianza y produccion de cuyes para pequenos productores.",
     "url": "https://ucanr.edu/sites/default/files/2024-06/manual-crianza-cuyes.pdf"},
    {"archivo": "CrianzaDeCuyes_com_razas_manejo_alimentacion",
     "cita": "CrianzaDeCuyes.com. Crianza de Cuyes: razas, manejo tecnico y alimentacion.",
     "url": "https://crianzadecuyes.com"},
    # ── GANADO BOVINO ─────────────────────────────────────────────────────────
    {"archivo": "MAGAP_hatos_ganaderos_buenas_practicas_pecuarias",
     "cita": "MAGAP Ecuador. Hatos ganaderos mejoran con buenas practicas pecuarias.",
     "url": "https://www.agricultura.gob.ec/tungurahua-hatos-ganaderos-mejoran-con-buenas-practicas-pecuarias/"},
    {"archivo": "FAO_manual_buenas_practicas_ganaderia_bovina",
     "cita": "FAO. Manual de Buenas Practicas de Ganaderia Bovina para la Produccion de Leche. 169 paginas.",
     "url": "https://www.fao.org/3/a0126s/a0126s00.pdf"},
    {"archivo": "ClubGanadero_tips_cuidado_cria_ganado_bovino",
     "cita": "Club Ganadero. Tips para el cuidado y cria de ganado bovino.",
     "url": "https://www.clubganadero.com/cria-de-ganado/"},
    {"archivo": "Agrotendencia_ganado_vacuno_tipos_razas_manejo",
     "cita": "Agrotendencia.tv. Ganado vacuno: tipos, razas, manejo y sistema de crianza.",
     "url": "https://agrotendencia.tv/agropedia/el-ganado-vacuno/"},
    {"archivo": "VITAAM_2024_principales_razas_ganado_vacuno_Ecuador",
     "cita": "VITAAM Ecuador (2024). Las principales razas de ganado vacuno en Ecuador.",
     "url": "https://vitaam.ec/las-principales-razas-de-ganado-vacuno-en-ecuador/"},
    {"archivo": "ContextoGanadero_2016_razas_bovinas_Suramerica",
     "cita": "CONtexto Ganadero (2016). Las razas bovinas que predominan en Suramerica.",
     "url": "https://www.contextoganadero.com/internacional/informe-las-razas-bovinas-que-predominan-en-suramerica"},
    {"archivo": "VeterinarioDigital_2021_razas_bovinas_especializadas_leche",
     "cita": "Veterinaria Digital (2021). Razas bovinas especializadas en leche.",
     "url": "https://www.veterinariadigital.com/articulos/razas-bovinas-especializadas-en-leche/"},
    {"archivo": "Agronet_2024_razas_ganado_bovino_Bos_taurus_Bos_indicus",
     "cita": "Agronet Colombia (2024). Razas de ganado bovino para tener en cada region.",
     "url": "https://agronet.gov.co/Noticias/razas-de-ganado-para-tener-en-cada-region"},
    {"archivo": "UDLA_2018_razas_ganado_carne_Ecuador_Brahman_Charolais",
     "cita": "Zapata Cando, C.L. (2018). Razas de ganado de carne en Ecuador. UDLA. 78 paginas.",
     "url": "https://dspace.udla.edu.ec/bitstream/33000/8832/1/UDLA-EC-TMVZ-2018-48.pdf"},
]

# ── Mapeo referencia → categoría ──────────────────────────────────────────────
MAPA_CATEGORIA = {
    "aves": [
        "pollos_camperos", "gallinas_criollas", "density_broilers",
        "backyard_systems", "bienestar_parrilleros", "pastoreo_gallinas",
        "parametros_productivos_huevo", "agroforestry_chicken",
        "sanidad_industria_avicola", "bioseguridad_pollos_engorde",
        "buenas_practicas_pollos_engorde", "manejo_pollos_engorde",
        "enfermedades_pollos_engorde", "vacunacion_aves_produccion",
        "limpieza_gallinero", "buenas_practicas_avicolas",
        "bienestar_gallinas_ponedoras", "normas_bienestar_gallinas",
        "produccion_manejo_aves", "enfermedades_respiratorias_aves",
        "sanidad_procesamiento_avicola", "libre_pecoreo_gallinas",
        "gallinas_libres_riesgos", "alternativas_crianza_libre_pastoreo",
        "gallinas_libres_Ecuador", "produccion_huevo_libre_jaula",
        "gallinas_libres_crianza_bienestar", "factibilidad_huevos_gallinas_pastoreo",
    ],
    "cerdos": [
        "produccion_porcicola", "reproduccion_cerdos", "sitio_multiple_cerdos",
        "cria_cerdos_potreros", "crianza_sanitaria_cerdos",
        "guia_granja_cerdos", "proceso_productivo_cerdos",
        "fases_crianza_cerdo", "manejo_produccion_porcino",
        "ciclo_vida_cerdo", "produccion_porcina_Ecuador",
        "sistemas_manejo_porcino", "exporta_carne_cerdo",
        "buenas_practicas_porcicolas", "porcicultura_manejo_sanitario",
        "salud_manejo_cerdos", "agricultura_regenerativa_porcicultura",
        "cerdo_iberico_agricultura_regenerativa",
        "reproductoras_porcinas_Ecuador", "razas_cerdo_Ecuador",
    ],
    "cabras": [
        "caprinocultura_Ecuador", "reproduccion_parto_cabras",
        "rendimiento_canal_cabra", "cabras_criollas_UNESUM",
        "crianza_cabras_tecnificada", "entorno_social_caprinos",
        "produccion_leche_cabras", "sistemas_caprinos_UPS",
        "ganaderia_regenerativa_caprino", "manejo_sanitario_hato_caprino",
        "manejo_general_cabras", "atencion_sanitaria_preventiva_cabras",
        "programa_nacional_sanitario_ovinos_caprinos",
        "nutricion_cabras", "sistemas_caprinos_Ecuador",
    ],
    "cuyes": [
        "sanidad_cuyes", "alimentacion_cuyes",
        "manejo_sanitario_bioseguridad_cuyes", "buenas_practicas_cuyes",
        "manual_manejo_cuyes", "crianza_cuyes_4_pilares",
        "bioseguridad_sanidad_cuyes", "iniciar_una_cuyera",
        "guia_crianza_cuyes", "modulo_crianza_cuyes",
        "productores_cuy_kits", "manual_crianza_produccion_cuyes",
        "CrianzaDeCuyes",
    ],
    "ganado_bovino": [
        "hatos_ganaderos", "ganaderia_bovina",
        "cuidado_cria_ganado_bovino", "ganado_vacuno",
        "razas_ganado_vacuno_Ecuador", "razas_bovinas_Suramerica",
        "razas_bovinas_especializadas_leche", "razas_ganado_bovino",
        "razas_ganado_carne_Ecuador",
    ],
}


def categorizar(archivo: str) -> str:
    """Devuelve la categoría que corresponde al nombre del archivo."""
    nombre = archivo.lower()
    for cat, palabras in MAPA_CATEGORIA.items():
        for p in palabras:
            if p.lower() in nombre:
                return cat
    # Fallback: búsqueda por palabras clave simples
    for cat, kws in CATEGORIAS.items():
        for kw in kws:
            if kw in nombre:
                return cat
    return "otros"


# ── Extracción de contenido web ────────────────────────────────────────────────
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
}


def limpiar_texto(texto: str) -> str:
    """Elimina espacios y saltos redundantes."""
    lineas = [l.strip() for l in texto.splitlines() if l.strip()]
    return "\n".join(lineas)


def extraer_contenido(url: str, timeout: int = 15) -> dict:
    """
    Descarga la URL y extrae:
      - titulo: <title> de la página
      - resumen: primeros N párrafos de texto significativo
      - ok: bool – True si se obtuvo contenido
    """
    resultado = {"titulo": "", "resumen": "", "ok": False}
    if not url or url.lower() in ("none", ""):
        resultado["resumen"] = "(Sin URL disponible)"
        return resultado

    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        resp.raise_for_status()

        # PDFs: no se parsean con BS4, sólo se registra el enlace
        ct = resp.headers.get("Content-Type", "")
        if "pdf" in ct or url.lower().endswith(".pdf"):
            resultado["titulo"] = url.split("/")[-1].replace("%20", " ")
            resultado["resumen"] = (
                f"[PDF] Documento descargable. Enlace directo: {url}\n"
                "Para leerlo, abrirlo con un visor de PDF."
            )
            resultado["ok"] = True
            return resultado

        soup = BeautifulSoup(resp.text, "html.parser")

        # Título
        titulo_tag = soup.find("title")
        resultado["titulo"] = titulo_tag.get_text(strip=True) if titulo_tag else ""

        # Eliminar nav, footer, scripts, etc.
        for tag in soup(["script", "style", "nav", "footer",
                          "header", "aside", "form"]):
            tag.decompose()

        # Recoger párrafos con contenido suficiente (>60 chars)
        parrafos = [
            p.get_text(separator=" ", strip=True)
            for p in soup.find_all(["p", "li", "h1", "h2", "h3"])
            if len(p.get_text(strip=True)) > 60
        ]
        resumen = limpiar_texto("\n\n".join(parrafos[:20]))
        resultado["resumen"] = resumen[:3000] + ("…" if len(resumen) > 3000 else "")
        resultado["ok"] = bool(resumen)

    except requests.exceptions.SSLError:
        resultado["resumen"] = f"[ERROR] Certificado SSL no válido. URL: {url}"
    except requests.exceptions.ConnectionError:
        resultado["resumen"] = f"[ERROR] No se pudo conectar. URL: {url}"
    except requests.exceptions.Timeout:
        resultado["resumen"] = f"[ERROR] Tiempo de espera agotado. URL: {url}"
    except requests.exceptions.HTTPError as e:
        resultado["resumen"] = f"[ERROR] HTTP {e.response.status_code}. URL: {url}"
    except Exception as e:
        resultado["resumen"] = f"[ERROR] {type(e).__name__}: {e}. URL: {url}"

    return resultado


# ── Nombre de archivo limpio ───────────────────────────────────────────────────
def nombre_limpio(texto: str) -> str:
    """Convierte una cadena en un nombre de fichero seguro."""
    texto = texto.lower()
    texto = re.sub(r"[áàäâ]", "a", texto)
    texto = re.sub(r"[éèëê]", "e", texto)
    texto = re.sub(r"[íìïî]", "i", texto)
    texto = re.sub(r"[óòöô]", "o", texto)
    texto = re.sub(r"[úùüû]", "u", texto)
    texto = re.sub(r"ñ", "n", texto)
    texto = re.sub(r"[^a-z0-9_\-]", "_", texto)
    texto = re.sub(r"_+", "_", texto).strip("_")
    return texto[:120]


# ── Escritura de fichas .md ────────────────────────────────────────────────────
def guardar_ficha(ref: dict, contenido: dict, categoria: str) -> str:
    """Escribe el archivo .md y devuelve la ruta del fichero creado."""
    directorio = os.path.join(BASE_OUT, categoria)
    os.makedirs(directorio, exist_ok=True)

    # Nombre descriptivo: preferir título web si lo hay, si no usar cita
    base = contenido.get("titulo") or ref["cita"][:80]
    fname = nombre_limpio(base) + ".md"
    ruta = os.path.join(directorio, fname)

    with open(ruta, "w", encoding="utf-8") as f:
        f.write(f"# {contenido.get('titulo') or ref['archivo']}\n\n")
        f.write(f"**Categoría:** {categoria}  \n")
        f.write(f"**Fuente:** {ref['cita']}  \n")
        f.write(f"**URL:** {ref['url']}  \n\n")
        f.write("---\n\n")
        f.write("## Contenido extraído\n\n")
        f.write(contenido.get("resumen", "(Sin contenido extraído)"))
        f.write("\n")

    return ruta


# ── Construcción del JSON para asistente_veterinario.json ─────────────────────
def construir_json(resultados: list) -> dict:
    """
    Genera la estructura JSON agrupada por categoría.
    Formato compatible con asistente_veterinario.json existente.
    """
    estructura = {
        "aves": {"referencias": []},
        "cerdos": {"referencias": []},
        "cabras": {"referencias": []},
        "cuyes": {"referencias": []},
        "ganado_bovino": {"referencias": []},
    }

    for r in resultados:
        cat = r["categoria"]
        if cat not in estructura:
            estructura[cat] = {"referencias": []}
        estructura[cat]["referencias"].append({
            "archivo": r["archivo"],
            "fuente": r["cita"],
            "url": r["url"],
            "titulo_web": r["titulo_web"],
            "resumen": r["resumen"][:500] + ("…" if len(r["resumen"]) > 500 else ""),
            "ok": r["ok"],
        })

    return estructura


# ── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    os.makedirs(BASE_OUT, exist_ok=True)
    total = len(REFERENCIAS)
    print(f"\n{'='*60}")
    print(f"  MELANT IA — Extractor de fichas veterinarias")
    print(f"  {total} referencias a procesar")
    print(f"  Salida: {BASE_OUT}")
    print(f"{'='*60}\n")

    resultados = []

    for i, ref in enumerate(REFERENCIAS, 1):
        categoria = categorizar(ref["archivo"])
        print(f"[{i:>3}/{total}] {categoria.upper():15s} | {ref['archivo'][:55]}")
        print(f"          URL: {ref['url'][:70]}")

        contenido = extraer_contenido(ref["url"])
        estado = "✓" if contenido["ok"] else "✗"
        print(f"          {estado} {'OK' if contenido['ok'] else 'ERROR'}\n")

        ruta_md = guardar_ficha(ref, contenido, categoria)

        resultados.append({
            "archivo":    ref["archivo"],
            "cita":       ref["cita"],
            "url":        ref["url"],
            "categoria":  categoria,
            "titulo_web": contenido.get("titulo", ""),
            "resumen":    contenido.get("resumen", ""),
            "ok":         contenido["ok"],
            "ruta_md":    ruta_md,
        })

        # Pausa cortés entre peticiones
        time.sleep(1.2)

    # ── Guardar JSON ampliado ────────────────────────────────────────────────
    json_data = construir_json(resultados)
    with open(JSON_AMPLIADO, "w", encoding="utf-8") as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)
    print(f"\n✓ JSON ampliado guardado en:\n  {JSON_AMPLIADO}")

    # ── Actualizar asistente_veterinario.json ────────────────────────────────
    destino = os.path.abspath(JSON_DEST)
    if os.path.isfile(destino):
        with open(destino, "r", encoding="utf-8") as f:
            existente = json.load(f)
    else:
        existente = {}

    # Fusionar: conservar datos existentes y agregar secciones nuevas
    for cat, datos in json_data.items():
        if cat not in existente:
            existente[cat] = datos
        else:
            # Agregar referencias que no existan (por "archivo")
            archivos_existentes = {
                r.get("archivo") for r in existente[cat].get("referencias", [])
            }
            nuevas = [
                r for r in datos["referencias"]
                if r["archivo"] not in archivos_existentes
            ]
            existente[cat].setdefault("referencias", []).extend(nuevas)

    os.makedirs(os.path.dirname(destino), exist_ok=True)
    with open(destino, "w", encoding="utf-8") as f:
        json.dump(existente, f, ensure_ascii=False, indent=2)
    print(f"✓ asistente_veterinario.json actualizado en:\n  {destino}")

    # ── Resumen final ────────────────────────────────────────────────────────
    ok_count = sum(1 for r in resultados if r["ok"])
    err_count = total - ok_count
    print(f"\n{'='*60}")
    print(f"  Fichas .md generadas : {total}")
    print(f"  Páginas accesibles   : {ok_count}")
    print(f"  Con error / PDF/DOI  : {err_count}")
    print(f"{'='*60}\n")
    print("Fichas por categoría:")
    for cat in ["aves", "cerdos", "cabras", "cuyes", "ganado_bovino"]:
        n = sum(1 for r in resultados if r["categoria"] == cat)
        print(f"  {cat:20s}: {n} fichas")

    print(f"\nTodas las fichas están en:\n  {BASE_OUT}\n")


if __name__ == "__main__":
    main()
