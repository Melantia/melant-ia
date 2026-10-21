-- ============================================================================
-- MELANTIA — Seed: catálogo geográfico Ecuador (DPA)
-- ----------------------------------------------------------------------------
-- Convención B6: los seeds viven en archivos separados del DDL.
-- Idempotente: re-ejecución segura (ON CONFLICT / NOT EXISTS).
-- Fuente: División Político-Administrativa INEC vía Open Admin Data
--         (CC-BY-4.0) https://github.com/open-admin-data/ecuador-administrative-divisions
-- codigo_inec: código oficial (provincia 2d, cantón 4d, parroquia 6d).
-- ============================================================================

BEGIN;

INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Cuenca', '0101' FROM provincias
WHERE codigo_inec = '01'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0101');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Girón', '0102' FROM provincias
WHERE codigo_inec = '01'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0102');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Gualaceo', '0103' FROM provincias
WHERE codigo_inec = '01'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0103');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Nabón', '0104' FROM provincias
WHERE codigo_inec = '01'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0104');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Paute', '0105' FROM provincias
WHERE codigo_inec = '01'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0105');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Pucará', '0106' FROM provincias
WHERE codigo_inec = '01'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0106');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'San Fernando', '0107' FROM provincias
WHERE codigo_inec = '01'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0107');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Santa Isabel', '0108' FROM provincias
WHERE codigo_inec = '01'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0108');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Sígsig', '0109' FROM provincias
WHERE codigo_inec = '01'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0109');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Oña', '0110' FROM provincias
WHERE codigo_inec = '01'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0110');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Chordeleg', '0111' FROM provincias
WHERE codigo_inec = '01'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0111');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'El Pan', '0112' FROM provincias
WHERE codigo_inec = '01'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0112');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Sevilla de Oro', '0113' FROM provincias
WHERE codigo_inec = '01'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0113');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Guachapala', '0114' FROM provincias
WHERE codigo_inec = '01'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0114');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Camilo Ponce enríquez', '0115' FROM provincias
WHERE codigo_inec = '01'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0115');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Guaranda', '0201' FROM provincias
WHERE codigo_inec = '02'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0201');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Chillanes', '0202' FROM provincias
WHERE codigo_inec = '02'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0202');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Chimbo', '0203' FROM provincias
WHERE codigo_inec = '02'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0203');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Echeandía', '0204' FROM provincias
WHERE codigo_inec = '02'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0204');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'San Miguel', '0205' FROM provincias
WHERE codigo_inec = '02'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0205');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Caluma', '0206' FROM provincias
WHERE codigo_inec = '02'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0206');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Las Naves', '0207' FROM provincias
WHERE codigo_inec = '02'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0207');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Azogues', '0301' FROM provincias
WHERE codigo_inec = '03'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0301');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Biblián', '0302' FROM provincias
WHERE codigo_inec = '03'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0302');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Cañar', '0303' FROM provincias
WHERE codigo_inec = '03'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0303');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'La Troncal', '0304' FROM provincias
WHERE codigo_inec = '03'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0304');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'El Tambo', '0305' FROM provincias
WHERE codigo_inec = '03'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0305');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Déleg', '0306' FROM provincias
WHERE codigo_inec = '03'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0306');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Suscal', '0307' FROM provincias
WHERE codigo_inec = '03'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0307');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Tulcán', '0401' FROM provincias
WHERE codigo_inec = '04'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0401');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Bolívar', '0402' FROM provincias
WHERE codigo_inec = '04'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0402');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Espejo', '0403' FROM provincias
WHERE codigo_inec = '04'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0403');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Mira', '0404' FROM provincias
WHERE codigo_inec = '04'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0404');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Montúfar', '0405' FROM provincias
WHERE codigo_inec = '04'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0405');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'San Pedro de Huaca', '0406' FROM provincias
WHERE codigo_inec = '04'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0406');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Latacunga', '0501' FROM provincias
WHERE codigo_inec = '05'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0501');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'La Maná', '0502' FROM provincias
WHERE codigo_inec = '05'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0502');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Pangua', '0503' FROM provincias
WHERE codigo_inec = '05'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0503');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Pujilí', '0504' FROM provincias
WHERE codigo_inec = '05'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0504');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Salcedo', '0505' FROM provincias
WHERE codigo_inec = '05'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0505');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Saquisilí', '0506' FROM provincias
WHERE codigo_inec = '05'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0506');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Sigchos', '0507' FROM provincias
WHERE codigo_inec = '05'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0507');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Riobamba', '0601' FROM provincias
WHERE codigo_inec = '06'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0601');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Alausí', '0602' FROM provincias
WHERE codigo_inec = '06'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0602');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Colta', '0603' FROM provincias
WHERE codigo_inec = '06'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0603');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Chambo', '0604' FROM provincias
WHERE codigo_inec = '06'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0604');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Chunchi', '0605' FROM provincias
WHERE codigo_inec = '06'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0605');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Guamote', '0606' FROM provincias
WHERE codigo_inec = '06'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0606');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Guano', '0607' FROM provincias
WHERE codigo_inec = '06'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0607');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Pallatanga', '0608' FROM provincias
WHERE codigo_inec = '06'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0608');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Penipe', '0609' FROM provincias
WHERE codigo_inec = '06'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0609');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Cumandá', '0610' FROM provincias
WHERE codigo_inec = '06'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0610');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Machala', '0701' FROM provincias
WHERE codigo_inec = '07'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0701');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Arenillas', '0702' FROM provincias
WHERE codigo_inec = '07'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0702');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Atahualpa', '0703' FROM provincias
WHERE codigo_inec = '07'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0703');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Balsas', '0704' FROM provincias
WHERE codigo_inec = '07'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0704');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Chilla', '0705' FROM provincias
WHERE codigo_inec = '07'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0705');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'El Guabo', '0706' FROM provincias
WHERE codigo_inec = '07'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0706');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Huaquillas', '0707' FROM provincias
WHERE codigo_inec = '07'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0707');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Marcabelí', '0708' FROM provincias
WHERE codigo_inec = '07'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0708');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Pasaje', '0709' FROM provincias
WHERE codigo_inec = '07'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0709');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Piñas', '0710' FROM provincias
WHERE codigo_inec = '07'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0710');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Portovelo', '0711' FROM provincias
WHERE codigo_inec = '07'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0711');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Santa Rosa', '0712' FROM provincias
WHERE codigo_inec = '07'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0712');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Zaruma', '0713' FROM provincias
WHERE codigo_inec = '07'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0713');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Las Lajas', '0714' FROM provincias
WHERE codigo_inec = '07'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0714');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Esmeraldas', '0801' FROM provincias
WHERE codigo_inec = '08'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0801');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Eloy Alfaro', '0802' FROM provincias
WHERE codigo_inec = '08'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0802');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Muisne', '0803' FROM provincias
WHERE codigo_inec = '08'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0803');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Quinindé', '0804' FROM provincias
WHERE codigo_inec = '08'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0804');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'San Lorenzo', '0805' FROM provincias
WHERE codigo_inec = '08'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0805');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Atacames', '0806' FROM provincias
WHERE codigo_inec = '08'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0806');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Rioverde', '0807' FROM provincias
WHERE codigo_inec = '08'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0807');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Guayaquil', '0901' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0901');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Alfredo Baquerizo Moreno (Juján)', '0902' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0902');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Balao', '0903' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0903');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Balzar', '0904' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0904');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Colimes', '0905' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0905');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Daule', '0906' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0906');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Durán', '0907' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0907');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'El Empalme', '0908' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0908');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'El Triunfo', '0909' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0909');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Milagro', '0910' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0910');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Naranjal', '0911' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0911');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Naranjito', '0912' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0912');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Palestina', '0913' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0913');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Pedro Carbo', '0914' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0914');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Samborondón', '0916' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0916');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Santa Lucía', '0918' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0918');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Salitre', '0919' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0919');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'San Jacinto de Yaguachi', '0920' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0920');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Playas', '0921' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0921');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Simón Bolívar', '0922' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0922');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Coronel Marcelino Maridueña', '0923' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0923');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Lomas de Sargentillo', '0924' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0924');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Nobol', '0925' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0925');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'General  Antonio Elizalde', '0927' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0927');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Isidro Ayora', '0928' FROM provincias
WHERE codigo_inec = '09'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '0928');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Ibarra', '1001' FROM provincias
WHERE codigo_inec = '10'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1001');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Antonio Ante', '1002' FROM provincias
WHERE codigo_inec = '10'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1002');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Cotacachi', '1003' FROM provincias
WHERE codigo_inec = '10'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1003');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Otavalo', '1004' FROM provincias
WHERE codigo_inec = '10'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1004');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Pimampiro', '1005' FROM provincias
WHERE codigo_inec = '10'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1005');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'San Miguel de Urcuquí', '1006' FROM provincias
WHERE codigo_inec = '10'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1006');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Loja', '1101' FROM provincias
WHERE codigo_inec = '11'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1101');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Calvas', '1102' FROM provincias
WHERE codigo_inec = '11'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1102');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Catamayo', '1103' FROM provincias
WHERE codigo_inec = '11'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1103');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Celica', '1104' FROM provincias
WHERE codigo_inec = '11'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1104');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Chaguarpamba', '1105' FROM provincias
WHERE codigo_inec = '11'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1105');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Espíndola', '1106' FROM provincias
WHERE codigo_inec = '11'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1106');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Gonzanamá', '1107' FROM provincias
WHERE codigo_inec = '11'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1107');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Macará', '1108' FROM provincias
WHERE codigo_inec = '11'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1108');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Paltas', '1109' FROM provincias
WHERE codigo_inec = '11'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1109');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Puyango', '1110' FROM provincias
WHERE codigo_inec = '11'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1110');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Saraguro', '1111' FROM provincias
WHERE codigo_inec = '11'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1111');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Sozoranga', '1112' FROM provincias
WHERE codigo_inec = '11'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1112');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Zapotillo', '1113' FROM provincias
WHERE codigo_inec = '11'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1113');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Pindal', '1114' FROM provincias
WHERE codigo_inec = '11'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1114');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Quilanga', '1115' FROM provincias
WHERE codigo_inec = '11'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1115');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Olmedo', '1116' FROM provincias
WHERE codigo_inec = '11'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1116');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Babahoyo', '1201' FROM provincias
WHERE codigo_inec = '12'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1201');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Baba', '1202' FROM provincias
WHERE codigo_inec = '12'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1202');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Montalvo', '1203' FROM provincias
WHERE codigo_inec = '12'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1203');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Puebloviejo', '1204' FROM provincias
WHERE codigo_inec = '12'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1204');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Quevedo', '1205' FROM provincias
WHERE codigo_inec = '12'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1205');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Urdaneta', '1206' FROM provincias
WHERE codigo_inec = '12'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1206');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Ventanas', '1207' FROM provincias
WHERE codigo_inec = '12'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1207');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Vinces', '1208' FROM provincias
WHERE codigo_inec = '12'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1208');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Palenque', '1209' FROM provincias
WHERE codigo_inec = '12'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1209');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Buena Fe', '1210' FROM provincias
WHERE codigo_inec = '12'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1210');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Valencia', '1211' FROM provincias
WHERE codigo_inec = '12'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1211');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Mocache', '1212' FROM provincias
WHERE codigo_inec = '12'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1212');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Quinsaloma', '1213' FROM provincias
WHERE codigo_inec = '12'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1213');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Portoviejo', '1301' FROM provincias
WHERE codigo_inec = '13'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1301');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Bolívar', '1302' FROM provincias
WHERE codigo_inec = '13'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1302');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Chone', '1303' FROM provincias
WHERE codigo_inec = '13'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1303');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'El Carmen', '1304' FROM provincias
WHERE codigo_inec = '13'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1304');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Flavio Alfaro', '1305' FROM provincias
WHERE codigo_inec = '13'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1305');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Jipijapa', '1306' FROM provincias
WHERE codigo_inec = '13'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1306');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Junín', '1307' FROM provincias
WHERE codigo_inec = '13'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1307');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Manta', '1308' FROM provincias
WHERE codigo_inec = '13'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1308');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Montecristi', '1309' FROM provincias
WHERE codigo_inec = '13'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1309');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Paján', '1310' FROM provincias
WHERE codigo_inec = '13'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1310');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Pichincha', '1311' FROM provincias
WHERE codigo_inec = '13'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1311');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Rocafuerte', '1312' FROM provincias
WHERE codigo_inec = '13'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1312');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Santa Ana', '1313' FROM provincias
WHERE codigo_inec = '13'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1313');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Sucre', '1314' FROM provincias
WHERE codigo_inec = '13'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1314');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Tosagua', '1315' FROM provincias
WHERE codigo_inec = '13'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1315');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, '24 de Mayo', '1316' FROM provincias
WHERE codigo_inec = '13'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1316');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Pedernales', '1317' FROM provincias
WHERE codigo_inec = '13'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1317');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Olmedo', '1318' FROM provincias
WHERE codigo_inec = '13'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1318');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Puerto López', '1319' FROM provincias
WHERE codigo_inec = '13'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1319');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Jama', '1320' FROM provincias
WHERE codigo_inec = '13'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1320');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Jaramijó', '1321' FROM provincias
WHERE codigo_inec = '13'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1321');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'San Vicente', '1322' FROM provincias
WHERE codigo_inec = '13'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1322');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Morona', '1401' FROM provincias
WHERE codigo_inec = '14'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1401');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Gualaquiza', '1402' FROM provincias
WHERE codigo_inec = '14'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1402');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Limón Indanza', '1403' FROM provincias
WHERE codigo_inec = '14'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1403');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Palora', '1404' FROM provincias
WHERE codigo_inec = '14'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1404');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Santiago', '1405' FROM provincias
WHERE codigo_inec = '14'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1405');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Sucúa', '1406' FROM provincias
WHERE codigo_inec = '14'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1406');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Huamboya', '1407' FROM provincias
WHERE codigo_inec = '14'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1407');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'San Juan Bosco', '1408' FROM provincias
WHERE codigo_inec = '14'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1408');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Taisha', '1409' FROM provincias
WHERE codigo_inec = '14'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1409');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Logroño', '1410' FROM provincias
WHERE codigo_inec = '14'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1410');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Pablo Sexto', '1411' FROM provincias
WHERE codigo_inec = '14'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1411');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Tiwintza', '1412' FROM provincias
WHERE codigo_inec = '14'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1412');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Tena', '1501' FROM provincias
WHERE codigo_inec = '15'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1501');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Archidona', '1503' FROM provincias
WHERE codigo_inec = '15'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1503');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'El Chaco', '1504' FROM provincias
WHERE codigo_inec = '15'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1504');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Quijos', '1507' FROM provincias
WHERE codigo_inec = '15'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1507');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Carlos Julio Arosemena Tola', '1509' FROM provincias
WHERE codigo_inec = '15'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1509');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Pastaza', '1601' FROM provincias
WHERE codigo_inec = '16'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1601');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Mera', '1602' FROM provincias
WHERE codigo_inec = '16'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1602');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Santa Clara', '1603' FROM provincias
WHERE codigo_inec = '16'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1603');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Arajuno', '1604' FROM provincias
WHERE codigo_inec = '16'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1604');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Distrito Metropolitano de Quito', '1701' FROM provincias
WHERE codigo_inec = '17'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1701');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Cayambe', '1702' FROM provincias
WHERE codigo_inec = '17'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1702');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Mejía', '1703' FROM provincias
WHERE codigo_inec = '17'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1703');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Pedro Moncayo', '1704' FROM provincias
WHERE codigo_inec = '17'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1704');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Rumiñahui', '1705' FROM provincias
WHERE codigo_inec = '17'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1705');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'San Miguel de los Bancos', '1707' FROM provincias
WHERE codigo_inec = '17'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1707');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Pedro Vicente Maldonado', '1708' FROM provincias
WHERE codigo_inec = '17'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1708');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Puerto Quito', '1709' FROM provincias
WHERE codigo_inec = '17'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1709');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Ambato', '1801' FROM provincias
WHERE codigo_inec = '18'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1801');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Baños de Agua Santa', '1802' FROM provincias
WHERE codigo_inec = '18'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1802');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Cevallos', '1803' FROM provincias
WHERE codigo_inec = '18'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1803');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Mocha', '1804' FROM provincias
WHERE codigo_inec = '18'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1804');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Patate', '1805' FROM provincias
WHERE codigo_inec = '18'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1805');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Quero', '1806' FROM provincias
WHERE codigo_inec = '18'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1806');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'San Pedro de Pelileo', '1807' FROM provincias
WHERE codigo_inec = '18'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1807');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Santiago de Píllaro', '1808' FROM provincias
WHERE codigo_inec = '18'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1808');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Tisaleo', '1809' FROM provincias
WHERE codigo_inec = '18'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1809');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Zamora', '1901' FROM provincias
WHERE codigo_inec = '19'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1901');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Chinchipe', '1902' FROM provincias
WHERE codigo_inec = '19'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1902');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Nangaritza', '1903' FROM provincias
WHERE codigo_inec = '19'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1903');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Yacuambi', '1904' FROM provincias
WHERE codigo_inec = '19'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1904');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Yantzaza', '1905' FROM provincias
WHERE codigo_inec = '19'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1905');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'El Pangui', '1906' FROM provincias
WHERE codigo_inec = '19'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1906');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Centinela del Cóndor', '1907' FROM provincias
WHERE codigo_inec = '19'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1907');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Palanda', '1908' FROM provincias
WHERE codigo_inec = '19'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1908');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Paquisha', '1909' FROM provincias
WHERE codigo_inec = '19'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '1909');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'San Cristóbal', '2001' FROM provincias
WHERE codigo_inec = '20'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '2001');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Isabela', '2002' FROM provincias
WHERE codigo_inec = '20'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '2002');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Santa Cruz', '2003' FROM provincias
WHERE codigo_inec = '20'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '2003');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Lago Agrio', '2101' FROM provincias
WHERE codigo_inec = '21'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '2101');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Gonzalo Pizarro', '2102' FROM provincias
WHERE codigo_inec = '21'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '2102');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Putumayo', '2103' FROM provincias
WHERE codigo_inec = '21'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '2103');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Shushufindi', '2104' FROM provincias
WHERE codigo_inec = '21'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '2104');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Sucumbíos', '2105' FROM provincias
WHERE codigo_inec = '21'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '2105');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Cascales', '2106' FROM provincias
WHERE codigo_inec = '21'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '2106');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Cuyabeno', '2107' FROM provincias
WHERE codigo_inec = '21'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '2107');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Francisco de Orellana', '2201' FROM provincias
WHERE codigo_inec = '22'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '2201');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Aguarico', '2202' FROM provincias
WHERE codigo_inec = '22'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '2202');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'La Joya de los Sachas', '2203' FROM provincias
WHERE codigo_inec = '22'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '2203');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Loreto', '2204' FROM provincias
WHERE codigo_inec = '22'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '2204');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Santo Domingo', '2301' FROM provincias
WHERE codigo_inec = '23'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '2301');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'La Concordia', '2302' FROM provincias
WHERE codigo_inec = '23'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '2302');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Santa Elena', '2401' FROM provincias
WHERE codigo_inec = '24'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '2401');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'La Libertad', '2402' FROM provincias
WHERE codigo_inec = '24'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '2402');
INSERT INTO cantones (provincia_id, nombre, codigo_inec)
SELECT id, 'Salinas', '2403' FROM provincias
WHERE codigo_inec = '24'
  AND NOT EXISTS (SELECT 1 FROM cantones WHERE codigo_inec = '2403');

COMMIT;
