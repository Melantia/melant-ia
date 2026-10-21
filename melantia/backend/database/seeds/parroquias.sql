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

INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cuenca', '010150' FROM cantones
WHERE codigo_inec = '0101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Baños', '010151' FROM cantones
WHERE codigo_inec = '0101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cumbe', '010152' FROM cantones
WHERE codigo_inec = '0101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chaucha', '010153' FROM cantones
WHERE codigo_inec = '0101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Checa', '010154' FROM cantones
WHERE codigo_inec = '0101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010154');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chiquintad', '010155' FROM cantones
WHERE codigo_inec = '0101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010155');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Llacao', '010156' FROM cantones
WHERE codigo_inec = '0101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010156');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Molleturo', '010157' FROM cantones
WHERE codigo_inec = '0101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010157');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Nulti', '010158' FROM cantones
WHERE codigo_inec = '0101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010158');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Octavio Cordero Palacios', '010159' FROM cantones
WHERE codigo_inec = '0101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010159');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Paccha', '010160' FROM cantones
WHERE codigo_inec = '0101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010160');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Quingeo', '010161' FROM cantones
WHERE codigo_inec = '0101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010161');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Ricaurte', '010162' FROM cantones
WHERE codigo_inec = '0101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010162');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Joaquín', '010163' FROM cantones
WHERE codigo_inec = '0101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010163');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Ana', '010164' FROM cantones
WHERE codigo_inec = '0101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010164');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sayausí', '010165' FROM cantones
WHERE codigo_inec = '0101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010165');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sidcay', '010166' FROM cantones
WHERE codigo_inec = '0101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010166');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sinincay', '010167' FROM cantones
WHERE codigo_inec = '0101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010167');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tarqui', '010168' FROM cantones
WHERE codigo_inec = '0101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010168');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Turi', '010169' FROM cantones
WHERE codigo_inec = '0101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010169');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Valle', '010170' FROM cantones
WHERE codigo_inec = '0101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010170');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Victoria del Portete', '010171' FROM cantones
WHERE codigo_inec = '0101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010171');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Girón', '010250' FROM cantones
WHERE codigo_inec = '0102'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Asunción', '010251' FROM cantones
WHERE codigo_inec = '0102'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Gerardo', '010252' FROM cantones
WHERE codigo_inec = '0102'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010252');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Gualaceo', '010350' FROM cantones
WHERE codigo_inec = '0103'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Daniel Córdova Toral', '010352' FROM cantones
WHERE codigo_inec = '0103'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010352');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Jadán', '010353' FROM cantones
WHERE codigo_inec = '0103'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010353');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Mariano Moreno', '010354' FROM cantones
WHERE codigo_inec = '0103'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010354');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Remigio Crespo Toral', '010356' FROM cantones
WHERE codigo_inec = '0103'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010356');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Juan', '010357' FROM cantones
WHERE codigo_inec = '0103'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010357');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Zhidmad', '010358' FROM cantones
WHERE codigo_inec = '0103'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010358');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Luis Cordero Vega', '010359' FROM cantones
WHERE codigo_inec = '0103'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010359');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Simón Bolívar', '010360' FROM cantones
WHERE codigo_inec = '0103'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010360');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Nabón', '010450' FROM cantones
WHERE codigo_inec = '0104'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cochapata', '010451' FROM cantones
WHERE codigo_inec = '0104'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010451');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Progreso', '010452' FROM cantones
WHERE codigo_inec = '0104'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010452');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Las Nieves', '010453' FROM cantones
WHERE codigo_inec = '0104'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010453');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Paute', '010550' FROM cantones
WHERE codigo_inec = '0105'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010550');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Bulán', '010552' FROM cantones
WHERE codigo_inec = '0105'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010552');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chicán', '010553' FROM cantones
WHERE codigo_inec = '0105'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010553');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Cabo', '010554' FROM cantones
WHERE codigo_inec = '0105'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010554');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guarainag', '010556' FROM cantones
WHERE codigo_inec = '0105'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010556');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Cristóbal', '010559' FROM cantones
WHERE codigo_inec = '0105'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010559');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tomebamba', '010561' FROM cantones
WHERE codigo_inec = '0105'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010561');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Dug Dug', '010562' FROM cantones
WHERE codigo_inec = '0105'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010562');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pucará', '010650' FROM cantones
WHERE codigo_inec = '0106'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010650');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Rafael de Sharug', '010652' FROM cantones
WHERE codigo_inec = '0106'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010652');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Fernando', '010750' FROM cantones
WHERE codigo_inec = '0107'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010750');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chumblín', '010751' FROM cantones
WHERE codigo_inec = '0107'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010751');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Isabel', '010850' FROM cantones
WHERE codigo_inec = '0108'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010850');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Abdón Calderón', '010851' FROM cantones
WHERE codigo_inec = '0108'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010851');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Carmen de Pijilí', '010852' FROM cantones
WHERE codigo_inec = '0108'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010852');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Shaglli', '010853' FROM cantones
WHERE codigo_inec = '0108'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010853');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Salvador de Cañaribamba', '010854' FROM cantones
WHERE codigo_inec = '0108'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010854');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sígsig', '010950' FROM cantones
WHERE codigo_inec = '0109'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010950');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cuchil', '010951' FROM cantones
WHERE codigo_inec = '0109'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010951');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Jima', '010952' FROM cantones
WHERE codigo_inec = '0109'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010952');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Güel', '010953' FROM cantones
WHERE codigo_inec = '0109'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010953');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Ludo', '010954' FROM cantones
WHERE codigo_inec = '0109'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010954');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Bartolomé', '010955' FROM cantones
WHERE codigo_inec = '0109'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010955');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San José de Raranga', '010956' FROM cantones
WHERE codigo_inec = '0109'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '010956');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Felipe de Oña', '011050' FROM cantones
WHERE codigo_inec = '0110'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '011050');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Susudel', '011051' FROM cantones
WHERE codigo_inec = '0110'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '011051');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chordeleg', '011150' FROM cantones
WHERE codigo_inec = '0111'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '011150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Principal', '011151' FROM cantones
WHERE codigo_inec = '0111'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '011151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Unión', '011152' FROM cantones
WHERE codigo_inec = '0111'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '011152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Luis Galarza Orellana', '011153' FROM cantones
WHERE codigo_inec = '0111'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '011153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Martín de Puzhio', '011154' FROM cantones
WHERE codigo_inec = '0111'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '011154');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Pan', '011250' FROM cantones
WHERE codigo_inec = '0112'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '011250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Vicente', '011253' FROM cantones
WHERE codigo_inec = '0112'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '011253');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sevilla de Oro', '011350' FROM cantones
WHERE codigo_inec = '0113'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '011350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Amaluza', '011351' FROM cantones
WHERE codigo_inec = '0113'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '011351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Palmas', '011352' FROM cantones
WHERE codigo_inec = '0113'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '011352');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guachapala', '011450' FROM cantones
WHERE codigo_inec = '0114'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '011450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Camilo Ponce enríquez', '011550' FROM cantones
WHERE codigo_inec = '0115'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '011550');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guaranda', '020150' FROM cantones
WHERE codigo_inec = '0201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Facundo Vela', '020151' FROM cantones
WHERE codigo_inec = '0201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Julio E. Moreno', '020153' FROM cantones
WHERE codigo_inec = '0201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Salinas', '020155' FROM cantones
WHERE codigo_inec = '0201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020155');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Lorenzo', '020156' FROM cantones
WHERE codigo_inec = '0201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020156');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Simón', '020157' FROM cantones
WHERE codigo_inec = '0201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020157');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Fe', '020158' FROM cantones
WHERE codigo_inec = '0201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020158');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Simiátug', '020159' FROM cantones
WHERE codigo_inec = '0201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020159');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Luis de Pambil', '020160' FROM cantones
WHERE codigo_inec = '0201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020160');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chillanes', '020250' FROM cantones
WHERE codigo_inec = '0202'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San José del Tambo', '020251' FROM cantones
WHERE codigo_inec = '0202'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San José de Chimbo', '020350' FROM cantones
WHERE codigo_inec = '0203'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Asunción', '020351' FROM cantones
WHERE codigo_inec = '0203'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Magdalena', '020353' FROM cantones
WHERE codigo_inec = '0203'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020353');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Sebastián', '020354' FROM cantones
WHERE codigo_inec = '0203'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020354');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Telimbela', '020355' FROM cantones
WHERE codigo_inec = '0203'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020355');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Echeandía', '020450' FROM cantones
WHERE codigo_inec = '0204'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Miguel', '020550' FROM cantones
WHERE codigo_inec = '0205'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020550');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Balsapamba', '020551' FROM cantones
WHERE codigo_inec = '0205'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020551');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Bilován', '020552' FROM cantones
WHERE codigo_inec = '0205'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020552');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Régulo de Mora', '020553' FROM cantones
WHERE codigo_inec = '0205'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020553');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Pablo', '020554' FROM cantones
WHERE codigo_inec = '0205'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020554');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santiago', '020555' FROM cantones
WHERE codigo_inec = '0205'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020555');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Vicente', '020556' FROM cantones
WHERE codigo_inec = '0205'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020556');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Caluma', '020650' FROM cantones
WHERE codigo_inec = '0206'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020650');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Las Naves', '020750' FROM cantones
WHERE codigo_inec = '0207'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '020750');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Azogues', '030150' FROM cantones
WHERE codigo_inec = '0301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cojitambo', '030151' FROM cantones
WHERE codigo_inec = '0301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guapán', '030153' FROM cantones
WHERE codigo_inec = '0301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Javier Loyola', '030154' FROM cantones
WHERE codigo_inec = '0301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030154');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Luis Cordero', '030155' FROM cantones
WHERE codigo_inec = '0301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030155');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pindilig', '030156' FROM cantones
WHERE codigo_inec = '0301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030156');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Rivera', '030157' FROM cantones
WHERE codigo_inec = '0301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030157');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Miguel', '030158' FROM cantones
WHERE codigo_inec = '0301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030158');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Taday', '030160' FROM cantones
WHERE codigo_inec = '0301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030160');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Biblián', '030250' FROM cantones
WHERE codigo_inec = '0302'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Nazón', '030251' FROM cantones
WHERE codigo_inec = '0302'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Francisco de Sageo', '030252' FROM cantones
WHERE codigo_inec = '0302'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030252');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Turupamba', '030253' FROM cantones
WHERE codigo_inec = '0302'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030253');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Jerusalén', '030254' FROM cantones
WHERE codigo_inec = '0302'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030254');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cañar', '030350' FROM cantones
WHERE codigo_inec = '0303'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chontamarca', '030351' FROM cantones
WHERE codigo_inec = '0303'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chorocopte', '030352' FROM cantones
WHERE codigo_inec = '0303'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030352');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'General Morales', '030353' FROM cantones
WHERE codigo_inec = '0303'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030353');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Gualleturo', '030354' FROM cantones
WHERE codigo_inec = '0303'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030354');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Honorato Vásquez', '030355' FROM cantones
WHERE codigo_inec = '0303'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030355');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Ingapirca', '030356' FROM cantones
WHERE codigo_inec = '0303'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030356');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Juncal', '030357' FROM cantones
WHERE codigo_inec = '0303'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030357');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Antonio', '030358' FROM cantones
WHERE codigo_inec = '0303'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030358');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Zhud', '030361' FROM cantones
WHERE codigo_inec = '0303'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030361');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Ventura', '030362' FROM cantones
WHERE codigo_inec = '0303'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030362');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Ducur', '030363' FROM cantones
WHERE codigo_inec = '0303'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030363');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Troncal', '030450' FROM cantones
WHERE codigo_inec = '0304'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Manuel J. Calle', '030451' FROM cantones
WHERE codigo_inec = '0304'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030451');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pancho Negro', '030452' FROM cantones
WHERE codigo_inec = '0304'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030452');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Tambo', '030550' FROM cantones
WHERE codigo_inec = '0305'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030550');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Déleg', '030650' FROM cantones
WHERE codigo_inec = '0306'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030650');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Solano', '030651' FROM cantones
WHERE codigo_inec = '0306'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030651');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Suscal', '030750' FROM cantones
WHERE codigo_inec = '0307'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '030750');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tulcán', '040150' FROM cantones
WHERE codigo_inec = '0401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Carmelo', '040151' FROM cantones
WHERE codigo_inec = '0401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Julio Andrade', '040153' FROM cantones
WHERE codigo_inec = '0401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Maldonado', '040154' FROM cantones
WHERE codigo_inec = '0401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040154');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pioter', '040155' FROM cantones
WHERE codigo_inec = '0401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040155');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tobar Donoso', '040156' FROM cantones
WHERE codigo_inec = '0401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040156');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tufiño', '040157' FROM cantones
WHERE codigo_inec = '0401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040157');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Urbina', '040158' FROM cantones
WHERE codigo_inec = '0401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040158');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Chical', '040159' FROM cantones
WHERE codigo_inec = '0401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040159');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Martha de Cuba', '040161' FROM cantones
WHERE codigo_inec = '0401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040161');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Bolívar', '040250' FROM cantones
WHERE codigo_inec = '0402'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'García Moreno', '040251' FROM cantones
WHERE codigo_inec = '0402'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Los Andes', '040252' FROM cantones
WHERE codigo_inec = '0402'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040252');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Monte Olivo', '040253' FROM cantones
WHERE codigo_inec = '0402'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040253');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Vicente de Pusir', '040254' FROM cantones
WHERE codigo_inec = '0402'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040254');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Rafael', '040255' FROM cantones
WHERE codigo_inec = '0402'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040255');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Ángel', '040350' FROM cantones
WHERE codigo_inec = '0403'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Goaltal', '040351' FROM cantones
WHERE codigo_inec = '0403'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Libertad', '040352' FROM cantones
WHERE codigo_inec = '0403'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040352');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Isidro', '040353' FROM cantones
WHERE codigo_inec = '0403'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040353');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Mira', '040450' FROM cantones
WHERE codigo_inec = '0404'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Concepción', '040451' FROM cantones
WHERE codigo_inec = '0404'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040451');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Jijón y Caamaño', '040452' FROM cantones
WHERE codigo_inec = '0404'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040452');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Juan Montalvo', '040453' FROM cantones
WHERE codigo_inec = '0404'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040453');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Gabriel', '040550' FROM cantones
WHERE codigo_inec = '0405'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040550');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cristóbal Colón', '040551' FROM cantones
WHERE codigo_inec = '0405'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040551');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chitán de Navarrete', '040552' FROM cantones
WHERE codigo_inec = '0405'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040552');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Fernández Salvador', '040553' FROM cantones
WHERE codigo_inec = '0405'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040553');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Paz', '040554' FROM cantones
WHERE codigo_inec = '0405'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040554');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Piartal', '040555' FROM cantones
WHERE codigo_inec = '0405'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040555');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Huaca', '040650' FROM cantones
WHERE codigo_inec = '0406'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040650');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Mariscal Sucre', '040651' FROM cantones
WHERE codigo_inec = '0406'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '040651');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Latacunga', '050150' FROM cantones
WHERE codigo_inec = '0501'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Aláquez', '050151' FROM cantones
WHERE codigo_inec = '0501'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Belisario Quevedo', '050152' FROM cantones
WHERE codigo_inec = '0501'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guaytacama', '050153' FROM cantones
WHERE codigo_inec = '0501'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Joseguango Bajo', '050154' FROM cantones
WHERE codigo_inec = '0501'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050154');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Mulaló', '050156' FROM cantones
WHERE codigo_inec = '0501'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050156');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Once de Noviembre', '050157' FROM cantones
WHERE codigo_inec = '0501'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050157');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Poaló', '050158' FROM cantones
WHERE codigo_inec = '0501'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050158');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Juan de Pastocalle', '050159' FROM cantones
WHERE codigo_inec = '0501'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050159');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tanicuchi', '050161' FROM cantones
WHERE codigo_inec = '0501'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050161');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Toacaso', '050162' FROM cantones
WHERE codigo_inec = '0501'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050162');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Maná', '050250' FROM cantones
WHERE codigo_inec = '0502'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guasaganda', '050251' FROM cantones
WHERE codigo_inec = '0502'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pucayacu', '050252' FROM cantones
WHERE codigo_inec = '0502'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050252');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Corazón', '050350' FROM cantones
WHERE codigo_inec = '0503'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Moraspungo', '050351' FROM cantones
WHERE codigo_inec = '0503'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pinllopata', '050352' FROM cantones
WHERE codigo_inec = '0503'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050352');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Ramón Campaña', '050353' FROM cantones
WHERE codigo_inec = '0503'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050353');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pujilí', '050450' FROM cantones
WHERE codigo_inec = '0504'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Angamarca', '050451' FROM cantones
WHERE codigo_inec = '0504'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050451');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guangaje', '050453' FROM cantones
WHERE codigo_inec = '0504'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050453');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Victoria', '050455' FROM cantones
WHERE codigo_inec = '0504'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050455');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pilaló', '050456' FROM cantones
WHERE codigo_inec = '0504'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050456');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tingo', '050457' FROM cantones
WHERE codigo_inec = '0504'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050457');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Zumbahua', '050458' FROM cantones
WHERE codigo_inec = '0504'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050458');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Miguel', '050550' FROM cantones
WHERE codigo_inec = '0505'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050550');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Antonio José Holguín', '050551' FROM cantones
WHERE codigo_inec = '0505'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050551');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cusubamba', '050552' FROM cantones
WHERE codigo_inec = '0505'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050552');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Mulalillo', '050553' FROM cantones
WHERE codigo_inec = '0505'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050553');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Mulliquindil', '050554' FROM cantones
WHERE codigo_inec = '0505'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050554');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pansaleo', '050555' FROM cantones
WHERE codigo_inec = '0505'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050555');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Saquisilí', '050650' FROM cantones
WHERE codigo_inec = '0506'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050650');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Canchagua', '050651' FROM cantones
WHERE codigo_inec = '0506'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050651');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chantilín', '050652' FROM cantones
WHERE codigo_inec = '0506'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050652');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cochapamba', '050653' FROM cantones
WHERE codigo_inec = '0506'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050653');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sigchos', '050750' FROM cantones
WHERE codigo_inec = '0507'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050750');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chugchillán', '050751' FROM cantones
WHERE codigo_inec = '0507'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050751');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Isinlivi', '050752' FROM cantones
WHERE codigo_inec = '0507'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050752');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Las Pampas', '050753' FROM cantones
WHERE codigo_inec = '0507'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050753');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Palo Quemado', '050754' FROM cantones
WHERE codigo_inec = '0507'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '050754');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Riobamba', '060150' FROM cantones
WHERE codigo_inec = '0601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cacha', '060151' FROM cantones
WHERE codigo_inec = '0601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Calpi', '060152' FROM cantones
WHERE codigo_inec = '0601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cubijíes', '060153' FROM cantones
WHERE codigo_inec = '0601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Flores', '060154' FROM cantones
WHERE codigo_inec = '0601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060154');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Licán', '060155' FROM cantones
WHERE codigo_inec = '0601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060155');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Licto', '060156' FROM cantones
WHERE codigo_inec = '0601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060156');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pungalá', '060157' FROM cantones
WHERE codigo_inec = '0601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060157');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Punín', '060158' FROM cantones
WHERE codigo_inec = '0601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060158');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Quimiag', '060159' FROM cantones
WHERE codigo_inec = '0601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060159');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Juan', '060160' FROM cantones
WHERE codigo_inec = '0601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060160');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Luis', '060161' FROM cantones
WHERE codigo_inec = '0601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060161');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Alausí', '060250' FROM cantones
WHERE codigo_inec = '0602'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Achupallas', '060251' FROM cantones
WHERE codigo_inec = '0602'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guasuntos', '060253' FROM cantones
WHERE codigo_inec = '0602'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060253');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Huigra', '060254' FROM cantones
WHERE codigo_inec = '0602'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060254');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Multitud', '060255' FROM cantones
WHERE codigo_inec = '0602'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060255');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pistishi', '060256' FROM cantones
WHERE codigo_inec = '0602'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060256');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pumallacta', '060257' FROM cantones
WHERE codigo_inec = '0602'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060257');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sevilla', '060258' FROM cantones
WHERE codigo_inec = '0602'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060258');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sibambe', '060259' FROM cantones
WHERE codigo_inec = '0602'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060259');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tixán', '060260' FROM cantones
WHERE codigo_inec = '0602'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060260');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Villa la Unión', '060350' FROM cantones
WHERE codigo_inec = '0603'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cañi', '060351' FROM cantones
WHERE codigo_inec = '0603'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Columbe', '060352' FROM cantones
WHERE codigo_inec = '0603'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060352');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Juan de Velasco', '060353' FROM cantones
WHERE codigo_inec = '0603'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060353');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santiago de Quito', '060354' FROM cantones
WHERE codigo_inec = '0603'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060354');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chambo', '060450' FROM cantones
WHERE codigo_inec = '0604'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chunchi', '060550' FROM cantones
WHERE codigo_inec = '0605'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060550');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Capzol', '060551' FROM cantones
WHERE codigo_inec = '0605'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060551');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Compud', '060552' FROM cantones
WHERE codigo_inec = '0605'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060552');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Gonzol', '060553' FROM cantones
WHERE codigo_inec = '0605'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060553');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Llagos', '060554' FROM cantones
WHERE codigo_inec = '0605'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060554');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guamote', '060650' FROM cantones
WHERE codigo_inec = '0606'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060650');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cebadas', '060651' FROM cantones
WHERE codigo_inec = '0606'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060651');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Palmira', '060652' FROM cantones
WHERE codigo_inec = '0606'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060652');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guano', '060750' FROM cantones
WHERE codigo_inec = '0607'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060750');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guanando', '060751' FROM cantones
WHERE codigo_inec = '0607'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060751');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Ilapo', '060752' FROM cantones
WHERE codigo_inec = '0607'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060752');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Providencia', '060753' FROM cantones
WHERE codigo_inec = '0607'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060753');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Andrés', '060754' FROM cantones
WHERE codigo_inec = '0607'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060754');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Gerardo', '060755' FROM cantones
WHERE codigo_inec = '0607'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060755');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Isidro de Patulú', '060756' FROM cantones
WHERE codigo_inec = '0607'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060756');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San José del Chazo', '060757' FROM cantones
WHERE codigo_inec = '0607'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060757');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Fé de Galán', '060758' FROM cantones
WHERE codigo_inec = '0607'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060758');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Valparaiso', '060759' FROM cantones
WHERE codigo_inec = '0607'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060759');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pallatanga', '060850' FROM cantones
WHERE codigo_inec = '0608'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060850');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Penipe', '060950' FROM cantones
WHERE codigo_inec = '0609'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060950');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Altar', '060951' FROM cantones
WHERE codigo_inec = '0609'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060951');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Matus', '060952' FROM cantones
WHERE codigo_inec = '0609'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060952');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Puela', '060953' FROM cantones
WHERE codigo_inec = '0609'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060953');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Antonio de Bayushig', '060954' FROM cantones
WHERE codigo_inec = '0609'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060954');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Candelaria', '060955' FROM cantones
WHERE codigo_inec = '0609'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060955');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Bilbao', '060956' FROM cantones
WHERE codigo_inec = '0609'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '060956');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cumandá', '061050' FROM cantones
WHERE codigo_inec = '0610'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '061050');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Machala', '070150' FROM cantones
WHERE codigo_inec = '0701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Retiro', '070152' FROM cantones
WHERE codigo_inec = '0701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Arenillas', '070250' FROM cantones
WHERE codigo_inec = '0702'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chacras', '070251' FROM cantones
WHERE codigo_inec = '0702'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Palmales', '070254' FROM cantones
WHERE codigo_inec = '0702'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070254');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Carcabón', '070255' FROM cantones
WHERE codigo_inec = '0702'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070255');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Cuca', '070256' FROM cantones
WHERE codigo_inec = '0702'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070256');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Paccha', '070350' FROM cantones
WHERE codigo_inec = '0703'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Ayapamba', '070351' FROM cantones
WHERE codigo_inec = '0703'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cordoncillo', '070352' FROM cantones
WHERE codigo_inec = '0703'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070352');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Milagro', '070353' FROM cantones
WHERE codigo_inec = '0703'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070353');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San José', '070354' FROM cantones
WHERE codigo_inec = '0703'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070354');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Juan de Cerro Azul', '070355' FROM cantones
WHERE codigo_inec = '0703'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070355');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Balsas', '070450' FROM cantones
WHERE codigo_inec = '0704'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Bellamaría', '070451' FROM cantones
WHERE codigo_inec = '0704'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070451');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chilla', '070550' FROM cantones
WHERE codigo_inec = '0705'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070550');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Guabo', '070650' FROM cantones
WHERE codigo_inec = '0706'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070650');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Barbones', '070651' FROM cantones
WHERE codigo_inec = '0706'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070651');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Iberia', '070652' FROM cantones
WHERE codigo_inec = '0706'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070652');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tendales', '070653' FROM cantones
WHERE codigo_inec = '0706'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070653');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Río Bonito', '070654' FROM cantones
WHERE codigo_inec = '0706'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070654');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Huaquillas', '070750' FROM cantones
WHERE codigo_inec = '0707'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070750');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Marcabelí', '070850' FROM cantones
WHERE codigo_inec = '0708'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070850');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Ingenio', '070851' FROM cantones
WHERE codigo_inec = '0708'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070851');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pasaje', '070950' FROM cantones
WHERE codigo_inec = '0709'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070950');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Buenavista', '070951' FROM cantones
WHERE codigo_inec = '0709'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070951');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Casacay', '070952' FROM cantones
WHERE codigo_inec = '0709'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070952');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Peaña', '070953' FROM cantones
WHERE codigo_inec = '0709'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070953');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Progreso', '070954' FROM cantones
WHERE codigo_inec = '0709'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070954');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Uzhcurrumi', '070955' FROM cantones
WHERE codigo_inec = '0709'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070955');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cañaquemada', '070956' FROM cantones
WHERE codigo_inec = '0709'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '070956');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Piñas', '071050' FROM cantones
WHERE codigo_inec = '0710'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071050');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Capiro', '071051' FROM cantones
WHERE codigo_inec = '0710'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071051');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Bocana', '071052' FROM cantones
WHERE codigo_inec = '0710'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071052');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Moromoro', '071053' FROM cantones
WHERE codigo_inec = '0710'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071053');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Piedras', '071054' FROM cantones
WHERE codigo_inec = '0710'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071054');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Roque', '071055' FROM cantones
WHERE codigo_inec = '0710'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071055');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Saracay', '071056' FROM cantones
WHERE codigo_inec = '0710'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071056');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Portovelo', '071150' FROM cantones
WHERE codigo_inec = '0711'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Curtincapa', '071151' FROM cantones
WHERE codigo_inec = '0711'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Morales', '071152' FROM cantones
WHERE codigo_inec = '0711'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Salatí', '071153' FROM cantones
WHERE codigo_inec = '0711'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Rosa', '071250' FROM cantones
WHERE codigo_inec = '0712'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Bellavista', '071251' FROM cantones
WHERE codigo_inec = '0712'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Jambelí', '071252' FROM cantones
WHERE codigo_inec = '0712'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071252');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Avanzada', '071253' FROM cantones
WHERE codigo_inec = '0712'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071253');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Antonio', '071254' FROM cantones
WHERE codigo_inec = '0712'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071254');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Torata', '071255' FROM cantones
WHERE codigo_inec = '0712'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071255');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Victoria', '071256' FROM cantones
WHERE codigo_inec = '0712'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071256');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Bellamaría', '071257' FROM cantones
WHERE codigo_inec = '0712'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071257');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Zaruma', '071350' FROM cantones
WHERE codigo_inec = '0713'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Abañín', '071351' FROM cantones
WHERE codigo_inec = '0713'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Arcapamba', '071352' FROM cantones
WHERE codigo_inec = '0713'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071352');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guanazán', '071353' FROM cantones
WHERE codigo_inec = '0713'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071353');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guizhaguiña', '071354' FROM cantones
WHERE codigo_inec = '0713'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071354');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Huertas', '071355' FROM cantones
WHERE codigo_inec = '0713'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071355');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Malvas', '071356' FROM cantones
WHERE codigo_inec = '0713'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071356');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Muluncay Grande', '071357' FROM cantones
WHERE codigo_inec = '0713'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071357');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sinsao', '071358' FROM cantones
WHERE codigo_inec = '0713'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071358');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Salvias', '071359' FROM cantones
WHERE codigo_inec = '0713'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071359');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Victoria', '071450' FROM cantones
WHERE codigo_inec = '0714'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Libertad', '071451' FROM cantones
WHERE codigo_inec = '0714'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071451');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Paraíso', '071452' FROM cantones
WHERE codigo_inec = '0714'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071452');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Isidro', '071453' FROM cantones
WHERE codigo_inec = '0714'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '071453');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Esmeraldas', '080150' FROM cantones
WHERE codigo_inec = '0801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Camarones', '080152' FROM cantones
WHERE codigo_inec = '0801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Coronel Carlos Concha Torres', '080153' FROM cantones
WHERE codigo_inec = '0801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chinca', '080154' FROM cantones
WHERE codigo_inec = '0801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080154');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Majua', '080159' FROM cantones
WHERE codigo_inec = '0801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080159');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Mateo', '080163' FROM cantones
WHERE codigo_inec = '0801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080163');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tabiazo', '080165' FROM cantones
WHERE codigo_inec = '0801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080165');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tachina', '080166' FROM cantones
WHERE codigo_inec = '0801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080166');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Vuelta Larga', '080168' FROM cantones
WHERE codigo_inec = '0801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080168');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Valdez', '080250' FROM cantones
WHERE codigo_inec = '0802'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Anchayacu', '080251' FROM cantones
WHERE codigo_inec = '0802'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Atahualpa', '080252' FROM cantones
WHERE codigo_inec = '0802'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080252');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Borbón', '080253' FROM cantones
WHERE codigo_inec = '0802'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080253');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Tola', '080254' FROM cantones
WHERE codigo_inec = '0802'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080254');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Luis Vargas Torres', '080255' FROM cantones
WHERE codigo_inec = '0802'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080255');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Maldonado', '080256' FROM cantones
WHERE codigo_inec = '0802'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080256');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pampanal de Bolívar', '080257' FROM cantones
WHERE codigo_inec = '0802'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080257');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Francisco de Onzole', '080258' FROM cantones
WHERE codigo_inec = '0802'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080258');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santo Domingo de Onzole', '080259' FROM cantones
WHERE codigo_inec = '0802'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080259');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Selva Alegre', '080260' FROM cantones
WHERE codigo_inec = '0802'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080260');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Telembí', '080261' FROM cantones
WHERE codigo_inec = '0802'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080261');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Colón Eloy del María', '080262' FROM cantones
WHERE codigo_inec = '0802'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080262');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San José de Cayapas', '080263' FROM cantones
WHERE codigo_inec = '0802'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080263');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Timbiré', '080264' FROM cantones
WHERE codigo_inec = '0802'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080264');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Lucía de Las Peñas', '080265' FROM cantones
WHERE codigo_inec = '0802'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080265');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Muisne', '080350' FROM cantones
WHERE codigo_inec = '0803'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Bolívar', '080351' FROM cantones
WHERE codigo_inec = '0803'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Daule', '080352' FROM cantones
WHERE codigo_inec = '0803'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080352');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Galera', '080353' FROM cantones
WHERE codigo_inec = '0803'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080353');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Quingue', '080354' FROM cantones
WHERE codigo_inec = '0803'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080354');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sálima', '080355' FROM cantones
WHERE codigo_inec = '0803'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080355');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Francisco', '080356' FROM cantones
WHERE codigo_inec = '0803'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080356');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Gregorio', '080357' FROM cantones
WHERE codigo_inec = '0803'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080357');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San José de Chamanga', '080358' FROM cantones
WHERE codigo_inec = '0803'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080358');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Rosa Zárate', '080450' FROM cantones
WHERE codigo_inec = '0804'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cube', '080451' FROM cantones
WHERE codigo_inec = '0804'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080451');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chura', '080452' FROM cantones
WHERE codigo_inec = '0804'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080452');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Malimpia', '080453' FROM cantones
WHERE codigo_inec = '0804'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080453');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Viche', '080454' FROM cantones
WHERE codigo_inec = '0804'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080454');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Unión', '080455' FROM cantones
WHERE codigo_inec = '0804'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080455');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Lorenzo', '080550' FROM cantones
WHERE codigo_inec = '0805'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080550');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Alto Tambo', '080551' FROM cantones
WHERE codigo_inec = '0805'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080551');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Ancón', '080552' FROM cantones
WHERE codigo_inec = '0805'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080552');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Calderón', '080553' FROM cantones
WHERE codigo_inec = '0805'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080553');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Carondelet', '080554' FROM cantones
WHERE codigo_inec = '0805'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080554');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, '5 de Junio', '080555' FROM cantones
WHERE codigo_inec = '0805'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080555');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Concepción', '080556' FROM cantones
WHERE codigo_inec = '0805'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080556');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Mataje', '080557' FROM cantones
WHERE codigo_inec = '0805'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080557');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Javier de Cachaví', '080558' FROM cantones
WHERE codigo_inec = '0805'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080558');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Rita', '080559' FROM cantones
WHERE codigo_inec = '0805'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080559');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tambillo', '080560' FROM cantones
WHERE codigo_inec = '0805'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080560');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tululbí', '080561' FROM cantones
WHERE codigo_inec = '0805'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080561');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Urbina', '080562' FROM cantones
WHERE codigo_inec = '0805'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080562');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Atacames', '080650' FROM cantones
WHERE codigo_inec = '0806'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080650');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Unión', '080651' FROM cantones
WHERE codigo_inec = '0806'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080651');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Súa', '080652' FROM cantones
WHERE codigo_inec = '0806'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080652');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tonchigüe', '080653' FROM cantones
WHERE codigo_inec = '0806'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080653');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tonsupa', '080654' FROM cantones
WHERE codigo_inec = '0806'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080654');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Rioverde', '080750' FROM cantones
WHERE codigo_inec = '0807'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080750');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chontaduro', '080751' FROM cantones
WHERE codigo_inec = '0807'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080751');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chumundé', '080752' FROM cantones
WHERE codigo_inec = '0807'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080752');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Lagarto', '080753' FROM cantones
WHERE codigo_inec = '0807'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080753');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Montalvo', '080754' FROM cantones
WHERE codigo_inec = '0807'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080754');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Rocafuerte', '080755' FROM cantones
WHERE codigo_inec = '0807'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '080755');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guayaquil', '090150' FROM cantones
WHERE codigo_inec = '0901'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '090150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Juan Gómez Rendón', '090152' FROM cantones
WHERE codigo_inec = '0901'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '090152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Morro', '090153' FROM cantones
WHERE codigo_inec = '0901'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '090153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Posorja', '090156' FROM cantones
WHERE codigo_inec = '0901'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '090156');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Puná', '090157' FROM cantones
WHERE codigo_inec = '0901'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '090157');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tenguel', '090158' FROM cantones
WHERE codigo_inec = '0901'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '090158');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Alfredo Baquerizo Moreno (Juján)', '090250' FROM cantones
WHERE codigo_inec = '0902'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '090250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Balao', '090350' FROM cantones
WHERE codigo_inec = '0903'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '090350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Balzar', '090450' FROM cantones
WHERE codigo_inec = '0904'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '090450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Colimes', '090550' FROM cantones
WHERE codigo_inec = '0905'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '090550');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Jacinto', '090551' FROM cantones
WHERE codigo_inec = '0905'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '090551');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Daule', '090650' FROM cantones
WHERE codigo_inec = '0906'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '090650');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Juan Bautista Aguirre', '090652' FROM cantones
WHERE codigo_inec = '0906'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '090652');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Laurel', '090653' FROM cantones
WHERE codigo_inec = '0906'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '090653');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Limonal', '090654' FROM cantones
WHERE codigo_inec = '0906'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '090654');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Los Lojas', '090656' FROM cantones
WHERE codigo_inec = '0906'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '090656');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Eloy Alfaro', '090750' FROM cantones
WHERE codigo_inec = '0907'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '090750');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Velasco Ibarra', '090850' FROM cantones
WHERE codigo_inec = '0908'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '090850');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guayas', '090851' FROM cantones
WHERE codigo_inec = '0908'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '090851');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Rosario', '090852' FROM cantones
WHERE codigo_inec = '0908'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '090852');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Triunfo', '090950' FROM cantones
WHERE codigo_inec = '0909'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '090950');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Milagro', '091050' FROM cantones
WHERE codigo_inec = '0910'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '091050');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chobo', '091051' FROM cantones
WHERE codigo_inec = '0910'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '091051');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Mariscal Sucre', '091053' FROM cantones
WHERE codigo_inec = '0910'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '091053');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Roberto Astudillo', '091054' FROM cantones
WHERE codigo_inec = '0910'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '091054');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Naranjal', '091150' FROM cantones
WHERE codigo_inec = '0911'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '091150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Jesús María', '091151' FROM cantones
WHERE codigo_inec = '0911'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '091151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Carlos', '091152' FROM cantones
WHERE codigo_inec = '0911'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '091152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Rosa de Flandes', '091153' FROM cantones
WHERE codigo_inec = '0911'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '091153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Taura', '091154' FROM cantones
WHERE codigo_inec = '0911'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '091154');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Naranjito', '091250' FROM cantones
WHERE codigo_inec = '0912'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '091250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Palestina', '091350' FROM cantones
WHERE codigo_inec = '0913'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '091350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pedro Carbo', '091450' FROM cantones
WHERE codigo_inec = '0914'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '091450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Valle de la Virgen', '091451' FROM cantones
WHERE codigo_inec = '0914'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '091451');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sabanilla', '091452' FROM cantones
WHERE codigo_inec = '0914'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '091452');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Samborondón', '091650' FROM cantones
WHERE codigo_inec = '0916'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '091650');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tarifa', '091651' FROM cantones
WHERE codigo_inec = '0916'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '091651');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Lucía', '091850' FROM cantones
WHERE codigo_inec = '0918'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '091850');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Salitre', '091950' FROM cantones
WHERE codigo_inec = '0919'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '091950');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'General Vernaza', '091951' FROM cantones
WHERE codigo_inec = '0919'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '091951');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Victoria', '091952' FROM cantones
WHERE codigo_inec = '0919'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '091952');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Junquillal', '091953' FROM cantones
WHERE codigo_inec = '0919'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '091953');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Jacinto de Yaguachi', '092050' FROM cantones
WHERE codigo_inec = '0920'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '092050');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'General Pedro J. Montero', '092053' FROM cantones
WHERE codigo_inec = '0920'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '092053');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Yaguachi Viejo', '092055' FROM cantones
WHERE codigo_inec = '0920'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '092055');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Virgen de Fátima', '092056' FROM cantones
WHERE codigo_inec = '0920'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '092056');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'General Villamil', '092150' FROM cantones
WHERE codigo_inec = '0921'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '092150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Simón Bolívar', '092250' FROM cantones
WHERE codigo_inec = '0922'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '092250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Coronel Lorenzo de Garaycoa', '092251' FROM cantones
WHERE codigo_inec = '0922'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '092251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Coronel Marcelino Maridueña', '092350' FROM cantones
WHERE codigo_inec = '0923'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '092350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Lomas de Sargentillo', '092450' FROM cantones
WHERE codigo_inec = '0924'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '092450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Narcisa de Jesús', '092550' FROM cantones
WHERE codigo_inec = '0925'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '092550');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'General Antonio Elizalde', '092750' FROM cantones
WHERE codigo_inec = '0927'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '092750');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Isidro Ayora', '092850' FROM cantones
WHERE codigo_inec = '0928'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '092850');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Miguel de Ibarra', '100150' FROM cantones
WHERE codigo_inec = '1001'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Ambuquí', '100151' FROM cantones
WHERE codigo_inec = '1001'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Angochagua', '100152' FROM cantones
WHERE codigo_inec = '1001'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Carolina', '100153' FROM cantones
WHERE codigo_inec = '1001'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Esperanza', '100154' FROM cantones
WHERE codigo_inec = '1001'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100154');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Lita', '100155' FROM cantones
WHERE codigo_inec = '1001'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100155');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Salinas', '100156' FROM cantones
WHERE codigo_inec = '1001'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100156');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Antonio', '100157' FROM cantones
WHERE codigo_inec = '1001'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100157');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Atuntaqui', '100250' FROM cantones
WHERE codigo_inec = '1002'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Imbaya', '100251' FROM cantones
WHERE codigo_inec = '1002'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Francisco de Natabuela', '100252' FROM cantones
WHERE codigo_inec = '1002'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100252');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San José de Chaltura', '100253' FROM cantones
WHERE codigo_inec = '1002'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100253');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Roque', '100254' FROM cantones
WHERE codigo_inec = '1002'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100254');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cotacachi', '100350' FROM cantones
WHERE codigo_inec = '1003'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Apuela', '100351' FROM cantones
WHERE codigo_inec = '1003'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'García Moreno', '100352' FROM cantones
WHERE codigo_inec = '1003'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100352');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Imantag', '100353' FROM cantones
WHERE codigo_inec = '1003'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100353');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Peñaherrera', '100354' FROM cantones
WHERE codigo_inec = '1003'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100354');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Plaza Gutiérrez', '100355' FROM cantones
WHERE codigo_inec = '1003'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100355');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Quiroga', '100356' FROM cantones
WHERE codigo_inec = '1003'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100356');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Seis de Julio de Cuellaje', '100357' FROM cantones
WHERE codigo_inec = '1003'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100357');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Vacas Galindo', '100358' FROM cantones
WHERE codigo_inec = '1003'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100358');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Otavalo', '100450' FROM cantones
WHERE codigo_inec = '1004'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Dr. Miguel Egas Cabezas', '100451' FROM cantones
WHERE codigo_inec = '1004'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100451');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Eugenio Espejo', '100452' FROM cantones
WHERE codigo_inec = '1004'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100452');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'González Suárez', '100453' FROM cantones
WHERE codigo_inec = '1004'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100453');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pataquí', '100454' FROM cantones
WHERE codigo_inec = '1004'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100454');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San José de Quichinche', '100455' FROM cantones
WHERE codigo_inec = '1004'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100455');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Juan de Ilumán', '100456' FROM cantones
WHERE codigo_inec = '1004'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100456');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Pablo', '100457' FROM cantones
WHERE codigo_inec = '1004'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100457');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Rafael', '100458' FROM cantones
WHERE codigo_inec = '1004'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100458');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Selva Alegre', '100459' FROM cantones
WHERE codigo_inec = '1004'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100459');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pimampiro', '100550' FROM cantones
WHERE codigo_inec = '1005'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100550');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chugá', '100551' FROM cantones
WHERE codigo_inec = '1005'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100551');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Mariano Acosta', '100552' FROM cantones
WHERE codigo_inec = '1005'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100552');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Francisco de Sigsipamba', '100553' FROM cantones
WHERE codigo_inec = '1005'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100553');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Urcuquí', '100650' FROM cantones
WHERE codigo_inec = '1006'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100650');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cahuasquí', '100651' FROM cantones
WHERE codigo_inec = '1006'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100651');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Merced de Buenos Aires', '100652' FROM cantones
WHERE codigo_inec = '1006'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100652');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pablo Arenas', '100653' FROM cantones
WHERE codigo_inec = '1006'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100653');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Blas', '100654' FROM cantones
WHERE codigo_inec = '1006'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100654');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tumbabiro', '100655' FROM cantones
WHERE codigo_inec = '1006'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '100655');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Loja', '110150' FROM cantones
WHERE codigo_inec = '1101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chantaco', '110151' FROM cantones
WHERE codigo_inec = '1101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chuquiribamba', '110152' FROM cantones
WHERE codigo_inec = '1101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Cisne', '110153' FROM cantones
WHERE codigo_inec = '1101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Gualel', '110154' FROM cantones
WHERE codigo_inec = '1101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110154');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Jimbilla', '110155' FROM cantones
WHERE codigo_inec = '1101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110155');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Malacatos', '110156' FROM cantones
WHERE codigo_inec = '1101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110156');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Lucas', '110157' FROM cantones
WHERE codigo_inec = '1101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110157');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Pedro de Vilcabamba', '110158' FROM cantones
WHERE codigo_inec = '1101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110158');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santiago', '110159' FROM cantones
WHERE codigo_inec = '1101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110159');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Taquil', '110160' FROM cantones
WHERE codigo_inec = '1101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110160');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Vilcabamba', '110161' FROM cantones
WHERE codigo_inec = '1101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110161');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Yangana', '110162' FROM cantones
WHERE codigo_inec = '1101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110162');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Quinara', '110163' FROM cantones
WHERE codigo_inec = '1101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110163');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cariamanga', '110250' FROM cantones
WHERE codigo_inec = '1102'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Colaisaca', '110251' FROM cantones
WHERE codigo_inec = '1102'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Lucero', '110252' FROM cantones
WHERE codigo_inec = '1102'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110252');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Utuana', '110253' FROM cantones
WHERE codigo_inec = '1102'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110253');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sanguillín', '110254' FROM cantones
WHERE codigo_inec = '1102'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110254');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Catamayo', '110350' FROM cantones
WHERE codigo_inec = '1103'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Tambo', '110351' FROM cantones
WHERE codigo_inec = '1103'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guayquichuma', '110352' FROM cantones
WHERE codigo_inec = '1103'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110352');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Pedro de la Bendita', '110353' FROM cantones
WHERE codigo_inec = '1103'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110353');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Zambi', '110354' FROM cantones
WHERE codigo_inec = '1103'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110354');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Celica', '110450' FROM cantones
WHERE codigo_inec = '1104'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cruzpamba', '110451' FROM cantones
WHERE codigo_inec = '1104'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110451');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pózul', '110455' FROM cantones
WHERE codigo_inec = '1104'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110455');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sabanilla', '110456' FROM cantones
WHERE codigo_inec = '1104'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110456');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Teniente Maximiliano Rodríguez Loaiza', '110457' FROM cantones
WHERE codigo_inec = '1104'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110457');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chaguarpamba', '110550' FROM cantones
WHERE codigo_inec = '1105'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110550');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Buenavista', '110551' FROM cantones
WHERE codigo_inec = '1105'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110551');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Rosario', '110552' FROM cantones
WHERE codigo_inec = '1105'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110552');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Rufina', '110553' FROM cantones
WHERE codigo_inec = '1105'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110553');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Amarillos', '110554' FROM cantones
WHERE codigo_inec = '1105'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110554');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Amaluza', '110650' FROM cantones
WHERE codigo_inec = '1106'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110650');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Bellavista', '110651' FROM cantones
WHERE codigo_inec = '1106'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110651');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Jimbura', '110652' FROM cantones
WHERE codigo_inec = '1106'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110652');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Teresita', '110653' FROM cantones
WHERE codigo_inec = '1106'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110653');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, '27 de Abril', '110654' FROM cantones
WHERE codigo_inec = '1106'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110654');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Ingenio', '110655' FROM cantones
WHERE codigo_inec = '1106'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110655');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Airo', '110656' FROM cantones
WHERE codigo_inec = '1106'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110656');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Gonzanamá', '110750' FROM cantones
WHERE codigo_inec = '1107'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110750');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Changaimina', '110751' FROM cantones
WHERE codigo_inec = '1107'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110751');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Nambacola', '110753' FROM cantones
WHERE codigo_inec = '1107'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110753');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Purunuma', '110754' FROM cantones
WHERE codigo_inec = '1107'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110754');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sacapalca', '110756' FROM cantones
WHERE codigo_inec = '1107'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110756');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Macará', '110850' FROM cantones
WHERE codigo_inec = '1108'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110850');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Larama', '110851' FROM cantones
WHERE codigo_inec = '1108'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110851');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Victoria', '110852' FROM cantones
WHERE codigo_inec = '1108'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110852');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sabiango', '110853' FROM cantones
WHERE codigo_inec = '1108'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110853');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Catacocha', '110950' FROM cantones
WHERE codigo_inec = '1109'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110950');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cangonamá', '110951' FROM cantones
WHERE codigo_inec = '1109'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110951');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guachanamá', '110952' FROM cantones
WHERE codigo_inec = '1109'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110952');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Lauro Guerrero', '110954' FROM cantones
WHERE codigo_inec = '1109'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110954');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Orianga', '110956' FROM cantones
WHERE codigo_inec = '1109'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110956');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Antonio', '110957' FROM cantones
WHERE codigo_inec = '1109'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110957');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Casanga', '110958' FROM cantones
WHERE codigo_inec = '1109'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110958');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Yamana', '110959' FROM cantones
WHERE codigo_inec = '1109'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '110959');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Alamor', '111050' FROM cantones
WHERE codigo_inec = '1110'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111050');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Ciano', '111051' FROM cantones
WHERE codigo_inec = '1110'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111051');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Arenal', '111052' FROM cantones
WHERE codigo_inec = '1110'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111052');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Limo', '111053' FROM cantones
WHERE codigo_inec = '1110'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111053');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Mercadillo', '111054' FROM cantones
WHERE codigo_inec = '1110'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111054');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Vicentino', '111055' FROM cantones
WHERE codigo_inec = '1110'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111055');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Saraguro', '111150' FROM cantones
WHERE codigo_inec = '1111'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Paraíso de Celen', '111151' FROM cantones
WHERE codigo_inec = '1111'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Tablón', '111152' FROM cantones
WHERE codigo_inec = '1111'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Lluzhapa', '111153' FROM cantones
WHERE codigo_inec = '1111'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Manú', '111154' FROM cantones
WHERE codigo_inec = '1111'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111154');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Antonio de Qumbe', '111155' FROM cantones
WHERE codigo_inec = '1111'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111155');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Pablo de Tenta', '111156' FROM cantones
WHERE codigo_inec = '1111'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111156');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Sebastián de Yúluc', '111157' FROM cantones
WHERE codigo_inec = '1111'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111157');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Selva Alegre', '111158' FROM cantones
WHERE codigo_inec = '1111'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111158');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Urdaneta', '111159' FROM cantones
WHERE codigo_inec = '1111'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111159');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sumaypamba', '111160' FROM cantones
WHERE codigo_inec = '1111'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111160');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sozoranga', '111250' FROM cantones
WHERE codigo_inec = '1112'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Nueva Fátima', '111251' FROM cantones
WHERE codigo_inec = '1112'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tacamoros', '111252' FROM cantones
WHERE codigo_inec = '1112'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111252');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Zapotillo', '111350' FROM cantones
WHERE codigo_inec = '1113'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Mangahurco', '111351' FROM cantones
WHERE codigo_inec = '1113'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Garzareal', '111352' FROM cantones
WHERE codigo_inec = '1113'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111352');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Limones', '111353' FROM cantones
WHERE codigo_inec = '1113'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111353');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Paletillas', '111354' FROM cantones
WHERE codigo_inec = '1113'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111354');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Bolaspamba', '111355' FROM cantones
WHERE codigo_inec = '1113'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111355');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cazaderos', '111356' FROM cantones
WHERE codigo_inec = '1113'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111356');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pindal', '111450' FROM cantones
WHERE codigo_inec = '1114'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chaquinal', '111451' FROM cantones
WHERE codigo_inec = '1114'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111451');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, '12 de Diciembre', '111452' FROM cantones
WHERE codigo_inec = '1114'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111452');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Milagros', '111453' FROM cantones
WHERE codigo_inec = '1114'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111453');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Quilanga', '111550' FROM cantones
WHERE codigo_inec = '1115'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111550');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Fundochamba', '111551' FROM cantones
WHERE codigo_inec = '1115'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111551');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Antonio de Las Aradas', '111552' FROM cantones
WHERE codigo_inec = '1115'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111552');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Olmedo', '111650' FROM cantones
WHERE codigo_inec = '1116'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111650');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Tingue', '111651' FROM cantones
WHERE codigo_inec = '1116'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '111651');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Babahoyo', '120150' FROM cantones
WHERE codigo_inec = '1201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Caracol', '120152' FROM cantones
WHERE codigo_inec = '1201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Febres Cordero', '120153' FROM cantones
WHERE codigo_inec = '1201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pimocha', '120154' FROM cantones
WHERE codigo_inec = '1201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120154');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Unión', '120155' FROM cantones
WHERE codigo_inec = '1201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120155');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Baba', '120250' FROM cantones
WHERE codigo_inec = '1202'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guare', '120251' FROM cantones
WHERE codigo_inec = '1202'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Isla de Bejucal', '120252' FROM cantones
WHERE codigo_inec = '1202'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120252');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Montalvo', '120350' FROM cantones
WHERE codigo_inec = '1203'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Esmeralda', '120351' FROM cantones
WHERE codigo_inec = '1203'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Puebloviejo', '120450' FROM cantones
WHERE codigo_inec = '1204'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Puerto Pechiche', '120451' FROM cantones
WHERE codigo_inec = '1204'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120451');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Juan', '120452' FROM cantones
WHERE codigo_inec = '1204'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120452');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Quevedo', '120550' FROM cantones
WHERE codigo_inec = '1205'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120550');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Carlos', '120553' FROM cantones
WHERE codigo_inec = '1205'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120553');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Esperanza', '120555' FROM cantones
WHERE codigo_inec = '1205'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120555');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Catarama', '120650' FROM cantones
WHERE codigo_inec = '1206'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120650');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Ricaurte', '120651' FROM cantones
WHERE codigo_inec = '1206'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120651');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Ventanas', '120750' FROM cantones
WHERE codigo_inec = '1207'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120750');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Zapotal', '120752' FROM cantones
WHERE codigo_inec = '1207'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120752');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chacarita', '120753' FROM cantones
WHERE codigo_inec = '1207'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120753');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Los Ángeles', '120754' FROM cantones
WHERE codigo_inec = '1207'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120754');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Vinces', '120850' FROM cantones
WHERE codigo_inec = '1208'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120850');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Antonio Sotomayor', '120851' FROM cantones
WHERE codigo_inec = '1208'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120851');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Palenque', '120950' FROM cantones
WHERE codigo_inec = '1209'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '120950');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Jacinto de Buena Fe', '121050' FROM cantones
WHERE codigo_inec = '1210'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '121050');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Patricia Pilar', '121051' FROM cantones
WHERE codigo_inec = '1210'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '121051');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Valencia', '121150' FROM cantones
WHERE codigo_inec = '1211'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '121150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Mocache', '121250' FROM cantones
WHERE codigo_inec = '1212'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '121250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Quinsaloma', '121350' FROM cantones
WHERE codigo_inec = '1213'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '121350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Portoviejo', '130150' FROM cantones
WHERE codigo_inec = '1301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Abdón Calderón', '130151' FROM cantones
WHERE codigo_inec = '1301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Alhajuela', '130152' FROM cantones
WHERE codigo_inec = '1301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Crucita', '130153' FROM cantones
WHERE codigo_inec = '1301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pueblo Nuevo', '130154' FROM cantones
WHERE codigo_inec = '1301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130154');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Riochico', '130155' FROM cantones
WHERE codigo_inec = '1301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130155');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Plácido', '130156' FROM cantones
WHERE codigo_inec = '1301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130156');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chirijos', '130157' FROM cantones
WHERE codigo_inec = '1301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130157');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Calceta', '130250' FROM cantones
WHERE codigo_inec = '1302'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Membrillo', '130251' FROM cantones
WHERE codigo_inec = '1302'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Quiroga', '130252' FROM cantones
WHERE codigo_inec = '1302'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130252');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chone', '130350' FROM cantones
WHERE codigo_inec = '1303'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Boyacá', '130351' FROM cantones
WHERE codigo_inec = '1303'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Canuto', '130352' FROM cantones
WHERE codigo_inec = '1303'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130352');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Convento', '130353' FROM cantones
WHERE codigo_inec = '1303'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130353');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chibunga', '130354' FROM cantones
WHERE codigo_inec = '1303'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130354');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Eloy Alfaro', '130355' FROM cantones
WHERE codigo_inec = '1303'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130355');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Ricaurte', '130356' FROM cantones
WHERE codigo_inec = '1303'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130356');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Antonio', '130357' FROM cantones
WHERE codigo_inec = '1303'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130357');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Carmen', '130450' FROM cantones
WHERE codigo_inec = '1304'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Wilfrido Loor Moreira', '130451' FROM cantones
WHERE codigo_inec = '1304'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130451');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Pedro de Suma', '130452' FROM cantones
WHERE codigo_inec = '1304'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130452');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa María', '130453' FROM cantones
WHERE codigo_inec = '1304'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130453');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Paraíso la 14', '130454' FROM cantones
WHERE codigo_inec = '1304'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130454');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Flavio Alfaro', '130550' FROM cantones
WHERE codigo_inec = '1305'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130550');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Francisco de Novillo', '130551' FROM cantones
WHERE codigo_inec = '1305'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130551');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Zapallo', '130552' FROM cantones
WHERE codigo_inec = '1305'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130552');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Jipijapa', '130650' FROM cantones
WHERE codigo_inec = '1306'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130650');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'América', '130651' FROM cantones
WHERE codigo_inec = '1306'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130651');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Anegado', '130652' FROM cantones
WHERE codigo_inec = '1306'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130652');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Julcuy', '130653' FROM cantones
WHERE codigo_inec = '1306'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130653');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Unión', '130654' FROM cantones
WHERE codigo_inec = '1306'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130654');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Membrillal', '130656' FROM cantones
WHERE codigo_inec = '1306'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130656');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pedro Pablo Gómez', '130657' FROM cantones
WHERE codigo_inec = '1306'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130657');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Puerto Cayo', '130658' FROM cantones
WHERE codigo_inec = '1306'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130658');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Junín', '130750' FROM cantones
WHERE codigo_inec = '1307'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130750');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Manta', '130850' FROM cantones
WHERE codigo_inec = '1308'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130850');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Lorenzo', '130851' FROM cantones
WHERE codigo_inec = '1308'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130851');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Marianita', '130852' FROM cantones
WHERE codigo_inec = '1308'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130852');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Montecristi', '130950' FROM cantones
WHERE codigo_inec = '1309'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130950');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Pila', '130952' FROM cantones
WHERE codigo_inec = '1309'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '130952');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Paján', '131050' FROM cantones
WHERE codigo_inec = '1310'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131050');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Campozano', '131051' FROM cantones
WHERE codigo_inec = '1310'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131051');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cascol', '131052' FROM cantones
WHERE codigo_inec = '1310'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131052');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guale', '131053' FROM cantones
WHERE codigo_inec = '1310'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131053');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Lascano', '131054' FROM cantones
WHERE codigo_inec = '1310'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131054');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pichincha', '131150' FROM cantones
WHERE codigo_inec = '1311'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Barraganete', '131151' FROM cantones
WHERE codigo_inec = '1311'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Sebastián', '131152' FROM cantones
WHERE codigo_inec = '1311'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Rocafuerte', '131250' FROM cantones
WHERE codigo_inec = '1312'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Ana de Vuelta Larga', '131350' FROM cantones
WHERE codigo_inec = '1313'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Ayacucho', '131351' FROM cantones
WHERE codigo_inec = '1313'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Honorato Vásquez', '131352' FROM cantones
WHERE codigo_inec = '1313'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131352');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Unión', '131353' FROM cantones
WHERE codigo_inec = '1313'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131353');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Pablo', '131355' FROM cantones
WHERE codigo_inec = '1313'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131355');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Bahia de Caráquez', '131450' FROM cantones
WHERE codigo_inec = '1314'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Charapotó', '131453' FROM cantones
WHERE codigo_inec = '1314'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131453');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Isidro', '131457' FROM cantones
WHERE codigo_inec = '1314'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131457');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tosagua', '131550' FROM cantones
WHERE codigo_inec = '1315'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131550');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Bachillero', '131551' FROM cantones
WHERE codigo_inec = '1315'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131551');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Ángel Pedro Giler', '131552' FROM cantones
WHERE codigo_inec = '1315'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131552');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sucre', '131650' FROM cantones
WHERE codigo_inec = '1316'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131650');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Bellavista', '131651' FROM cantones
WHERE codigo_inec = '1316'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131651');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Noboa', '131652' FROM cantones
WHERE codigo_inec = '1316'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131652');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Arquitecto Sixto Durán Ballén', '131653' FROM cantones
WHERE codigo_inec = '1316'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131653');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pedernales', '131750' FROM cantones
WHERE codigo_inec = '1317'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131750');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cojimíes', '131751' FROM cantones
WHERE codigo_inec = '1317'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131751');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Diez de Agosto', '131752' FROM cantones
WHERE codigo_inec = '1317'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131752');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Atahualpa', '131753' FROM cantones
WHERE codigo_inec = '1317'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131753');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Olmedo', '131850' FROM cantones
WHERE codigo_inec = '1318'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131850');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Puerto López', '131950' FROM cantones
WHERE codigo_inec = '1319'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131950');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Machalilla', '131951' FROM cantones
WHERE codigo_inec = '1319'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131951');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Salango', '131952' FROM cantones
WHERE codigo_inec = '1319'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '131952');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Jama', '132050' FROM cantones
WHERE codigo_inec = '1320'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '132050');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Jaramijó', '132150' FROM cantones
WHERE codigo_inec = '1321'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '132150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Vicente', '132250' FROM cantones
WHERE codigo_inec = '1322'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '132250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Canoa', '132251' FROM cantones
WHERE codigo_inec = '1322'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '132251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Macas', '140150' FROM cantones
WHERE codigo_inec = '1401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Alshi', '140151' FROM cantones
WHERE codigo_inec = '1401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'General Proaño', '140153' FROM cantones
WHERE codigo_inec = '1401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Isidro', '140156' FROM cantones
WHERE codigo_inec = '1401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140156');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sevilla Don Bosco', '140157' FROM cantones
WHERE codigo_inec = '1401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140157');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sinaí', '140158' FROM cantones
WHERE codigo_inec = '1401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140158');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Zuña', '140160' FROM cantones
WHERE codigo_inec = '1401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140160');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cuchaentza', '140162' FROM cantones
WHERE codigo_inec = '1401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140162');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Río Blanco', '140164' FROM cantones
WHERE codigo_inec = '1401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140164');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Gualaquiza', '140250' FROM cantones
WHERE codigo_inec = '1402'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Amazonas', '140251' FROM cantones
WHERE codigo_inec = '1402'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Bermejos', '140252' FROM cantones
WHERE codigo_inec = '1402'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140252');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Bomboíza', '140253' FROM cantones
WHERE codigo_inec = '1402'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140253');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chigüinda', '140254' FROM cantones
WHERE codigo_inec = '1402'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140254');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Rosario', '140255' FROM cantones
WHERE codigo_inec = '1402'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140255');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Nueva Tarqui', '140256' FROM cantones
WHERE codigo_inec = '1402'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140256');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Miguel de Cuyes', '140257' FROM cantones
WHERE codigo_inec = '1402'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140257');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Ideal', '140258' FROM cantones
WHERE codigo_inec = '1402'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140258');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Gral. Leonidas Plaza Gutiérrez', '140350' FROM cantones
WHERE codigo_inec = '1403'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Indanza', '140351' FROM cantones
WHERE codigo_inec = '1403'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Antonio', '140353' FROM cantones
WHERE codigo_inec = '1403'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140353');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Miguel de Conchay', '140356' FROM cantones
WHERE codigo_inec = '1403'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140356');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Susana de Chiviaza', '140357' FROM cantones
WHERE codigo_inec = '1403'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140357');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Yunganza', '140358' FROM cantones
WHERE codigo_inec = '1403'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140358');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Palora', '140450' FROM cantones
WHERE codigo_inec = '1404'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Arapicos', '140451' FROM cantones
WHERE codigo_inec = '1404'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140451');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cumandá', '140452' FROM cantones
WHERE codigo_inec = '1404'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140452');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sangay', '140454' FROM cantones
WHERE codigo_inec = '1404'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140454');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, '16 de Agosto', '140455' FROM cantones
WHERE codigo_inec = '1404'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140455');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santiago de Méndez', '140550' FROM cantones
WHERE codigo_inec = '1405'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140550');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Copal', '140551' FROM cantones
WHERE codigo_inec = '1405'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140551');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chupianza', '140552' FROM cantones
WHERE codigo_inec = '1405'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140552');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Patuca', '140553' FROM cantones
WHERE codigo_inec = '1405'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140553');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Luis de El Acho', '140554' FROM cantones
WHERE codigo_inec = '1405'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140554');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tayuza', '140556' FROM cantones
WHERE codigo_inec = '1405'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140556');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Francisco de Chinimbimi', '140557' FROM cantones
WHERE codigo_inec = '1405'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140557');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sucúa', '140650' FROM cantones
WHERE codigo_inec = '1406'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140650');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Asunción', '140651' FROM cantones
WHERE codigo_inec = '1406'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140651');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Huambi', '140652' FROM cantones
WHERE codigo_inec = '1406'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140652');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Marianita de Jesús', '140655' FROM cantones
WHERE codigo_inec = '1406'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140655');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Huamboya', '140750' FROM cantones
WHERE codigo_inec = '1407'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140750');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chiguaza', '140751' FROM cantones
WHERE codigo_inec = '1407'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140751');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Juan Bosco', '140850' FROM cantones
WHERE codigo_inec = '1408'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140850');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pan de Azúcar', '140851' FROM cantones
WHERE codigo_inec = '1408'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140851');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Carlos de Limón', '140852' FROM cantones
WHERE codigo_inec = '1408'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140852');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Jacinto de Wakambeis', '140853' FROM cantones
WHERE codigo_inec = '1408'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140853');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santiago de Pananza', '140854' FROM cantones
WHERE codigo_inec = '1408'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140854');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Taisha', '140950' FROM cantones
WHERE codigo_inec = '1409'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140950');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Huasaga', '140951' FROM cantones
WHERE codigo_inec = '1409'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140951');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Macuma', '140952' FROM cantones
WHERE codigo_inec = '1409'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140952');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tuutinentsa', '140953' FROM cantones
WHERE codigo_inec = '1409'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140953');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pumpuentsa', '140954' FROM cantones
WHERE codigo_inec = '1409'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '140954');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Logroño', '141050' FROM cantones
WHERE codigo_inec = '1410'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '141050');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Yaupi', '141051' FROM cantones
WHERE codigo_inec = '1410'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '141051');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Shimpis', '141052' FROM cantones
WHERE codigo_inec = '1410'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '141052');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pablo Sexto', '141150' FROM cantones
WHERE codigo_inec = '1411'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '141150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santiago', '141250' FROM cantones
WHERE codigo_inec = '1412'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '141250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San José de Morona', '141251' FROM cantones
WHERE codigo_inec = '1412'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '141251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tena', '150150' FROM cantones
WHERE codigo_inec = '1501'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Ahuano', '150151' FROM cantones
WHERE codigo_inec = '1501'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chontapunta', '150153' FROM cantones
WHERE codigo_inec = '1501'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pano', '150154' FROM cantones
WHERE codigo_inec = '1501'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150154');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Puerto Misahuallí', '150155' FROM cantones
WHERE codigo_inec = '1501'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150155');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Puerto Napo', '150156' FROM cantones
WHERE codigo_inec = '1501'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150156');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tálag', '150157' FROM cantones
WHERE codigo_inec = '1501'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150157');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Juan de Muyuna', '150158' FROM cantones
WHERE codigo_inec = '1501'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150158');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Archidona', '150350' FROM cantones
WHERE codigo_inec = '1503'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cotundo', '150352' FROM cantones
WHERE codigo_inec = '1503'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150352');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Pablo de Ushpayacu', '150354' FROM cantones
WHERE codigo_inec = '1503'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150354');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Hatun Sumaku', '150356' FROM cantones
WHERE codigo_inec = '1503'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150356');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Chaco', '150450' FROM cantones
WHERE codigo_inec = '1504'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Gonzalo Díaz de Pineda', '150451' FROM cantones
WHERE codigo_inec = '1504'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150451');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Linares', '150452' FROM cantones
WHERE codigo_inec = '1504'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150452');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Oyacachi', '150453' FROM cantones
WHERE codigo_inec = '1504'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150453');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Rosa', '150454' FROM cantones
WHERE codigo_inec = '1504'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150454');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sardinas', '150455' FROM cantones
WHERE codigo_inec = '1504'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150455');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Baeza', '150750' FROM cantones
WHERE codigo_inec = '1507'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150750');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cosanga', '150751' FROM cantones
WHERE codigo_inec = '1507'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150751');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cuyuja', '150752' FROM cantones
WHERE codigo_inec = '1507'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150752');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Papallacta', '150753' FROM cantones
WHERE codigo_inec = '1507'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150753');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Francisco de Borja', '150754' FROM cantones
WHERE codigo_inec = '1507'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150754');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sumaco', '150756' FROM cantones
WHERE codigo_inec = '1507'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150756');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Carlos Julio Arosemena Tola', '150950' FROM cantones
WHERE codigo_inec = '1509'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '150950');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Puyo', '160150' FROM cantones
WHERE codigo_inec = '1601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '160150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Canelos', '160152' FROM cantones
WHERE codigo_inec = '1601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '160152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Diez de Agosto', '160154' FROM cantones
WHERE codigo_inec = '1601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '160154');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Fátima', '160155' FROM cantones
WHERE codigo_inec = '1601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '160155');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Montalvo', '160156' FROM cantones
WHERE codigo_inec = '1601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '160156');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pomona', '160157' FROM cantones
WHERE codigo_inec = '1601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '160157');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Río Corrientes', '160158' FROM cantones
WHERE codigo_inec = '1601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '160158');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Río Tigre', '160159' FROM cantones
WHERE codigo_inec = '1601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '160159');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sarayacu', '160161' FROM cantones
WHERE codigo_inec = '1601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '160161');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Simón Bolívar', '160162' FROM cantones
WHERE codigo_inec = '1601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '160162');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tarqui', '160163' FROM cantones
WHERE codigo_inec = '1601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '160163');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Teniente Hugo Ortiz', '160164' FROM cantones
WHERE codigo_inec = '1601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '160164');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Veracruz', '160165' FROM cantones
WHERE codigo_inec = '1601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '160165');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Triunfo', '160166' FROM cantones
WHERE codigo_inec = '1601'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '160166');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Mera', '160250' FROM cantones
WHERE codigo_inec = '1602'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '160250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Madre Tierra', '160251' FROM cantones
WHERE codigo_inec = '1602'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '160251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Shell', '160252' FROM cantones
WHERE codigo_inec = '1602'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '160252');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Clara', '160350' FROM cantones
WHERE codigo_inec = '1603'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '160350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San José', '160351' FROM cantones
WHERE codigo_inec = '1603'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '160351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Arajuno', '160450' FROM cantones
WHERE codigo_inec = '1604'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '160450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Curaray', '160451' FROM cantones
WHERE codigo_inec = '1604'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '160451');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Quito', '170150' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Alangasí', '170151' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Amaguaña', '170152' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Atahualpa', '170153' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Calacalí', '170154' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170154');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Calderón', '170155' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170155');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Conocoto', '170156' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170156');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cumbayá', '170157' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170157');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chavezpamba', '170158' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170158');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Checa', '170159' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170159');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Quinche', '170160' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170160');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Gualea', '170161' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170161');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guangopolo', '170162' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170162');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guayllabamba', '170163' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170163');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Merced', '170164' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170164');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Llano Chico', '170165' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170165');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Lloa', '170166' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170166');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Nanegal', '170168' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170168');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Nanegalito', '170169' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170169');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Nayón', '170170' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170170');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Nono', '170171' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170171');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pacto', '170172' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170172');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Perucho', '170174' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170174');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pifo', '170175' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170175');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Píntag', '170176' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170176');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pomasqui', '170177' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170177');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Puéllaro', '170178' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170178');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Puembo', '170179' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170179');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Antonio', '170180' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170180');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San José de Minas', '170181' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170181');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tababela', '170183' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170183');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tumbaco', '170184' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170184');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Yaruquí', '170185' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170185');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Zámbiza', '170186' FROM cantones
WHERE codigo_inec = '1701'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170186');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cayambe', '170250' FROM cantones
WHERE codigo_inec = '1702'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Ascázubi', '170251' FROM cantones
WHERE codigo_inec = '1702'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cangahua', '170252' FROM cantones
WHERE codigo_inec = '1702'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170252');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Olmedo', '170253' FROM cantones
WHERE codigo_inec = '1702'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170253');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Otón', '170254' FROM cantones
WHERE codigo_inec = '1702'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170254');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Rosa de Cuzubamba', '170255' FROM cantones
WHERE codigo_inec = '1702'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170255');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San José de Ayora', '170256' FROM cantones
WHERE codigo_inec = '1702'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170256');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Machachi', '170350' FROM cantones
WHERE codigo_inec = '1703'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Aloag', '170351' FROM cantones
WHERE codigo_inec = '1703'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Aloasí', '170352' FROM cantones
WHERE codigo_inec = '1703'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170352');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cutuglahua', '170353' FROM cantones
WHERE codigo_inec = '1703'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170353');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Chaupi', '170354' FROM cantones
WHERE codigo_inec = '1703'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170354');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Manuel Cornejo Astorga', '170355' FROM cantones
WHERE codigo_inec = '1703'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170355');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tambillo', '170356' FROM cantones
WHERE codigo_inec = '1703'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170356');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Uyumbicho', '170357' FROM cantones
WHERE codigo_inec = '1703'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170357');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tabacundo', '170450' FROM cantones
WHERE codigo_inec = '1704'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Esperanza', '170451' FROM cantones
WHERE codigo_inec = '1704'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170451');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Malchinguí', '170452' FROM cantones
WHERE codigo_inec = '1704'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170452');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tocachi', '170453' FROM cantones
WHERE codigo_inec = '1704'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170453');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tupigachi', '170454' FROM cantones
WHERE codigo_inec = '1704'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170454');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sangolquí', '170550' FROM cantones
WHERE codigo_inec = '1705'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170550');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cotogchoa', '170551' FROM cantones
WHERE codigo_inec = '1705'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170551');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Rumipamba', '170552' FROM cantones
WHERE codigo_inec = '1705'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170552');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Miguel de los Bancos', '170750' FROM cantones
WHERE codigo_inec = '1707'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170750');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Mindo', '170751' FROM cantones
WHERE codigo_inec = '1707'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170751');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pedro Vicente Maldonado', '170850' FROM cantones
WHERE codigo_inec = '1708'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170850');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Puerto Quito', '170950' FROM cantones
WHERE codigo_inec = '1709'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '170950');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Ambato', '180150' FROM cantones
WHERE codigo_inec = '1801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Ambatillo', '180151' FROM cantones
WHERE codigo_inec = '1801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Atahualpa', '180152' FROM cantones
WHERE codigo_inec = '1801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Augusto N. Martínez', '180153' FROM cantones
WHERE codigo_inec = '1801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Constantino Fernández', '180154' FROM cantones
WHERE codigo_inec = '1801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180154');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Huachi Grande', '180155' FROM cantones
WHERE codigo_inec = '1801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180155');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Izamba', '180156' FROM cantones
WHERE codigo_inec = '1801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180156');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Juan Benigno Vela', '180157' FROM cantones
WHERE codigo_inec = '1801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180157');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Montalvo', '180158' FROM cantones
WHERE codigo_inec = '1801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180158');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pasa', '180159' FROM cantones
WHERE codigo_inec = '1801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180159');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Picaihua', '180160' FROM cantones
WHERE codigo_inec = '1801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180160');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pilagüín', '180161' FROM cantones
WHERE codigo_inec = '1801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180161');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Quisapincha', '180162' FROM cantones
WHERE codigo_inec = '1801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180162');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Bartolomé de Pinllo', '180163' FROM cantones
WHERE codigo_inec = '1801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180163');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Fernando', '180164' FROM cantones
WHERE codigo_inec = '1801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180164');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Rosa', '180165' FROM cantones
WHERE codigo_inec = '1801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180165');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Totoras', '180166' FROM cantones
WHERE codigo_inec = '1801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180166');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cunchibamba', '180167' FROM cantones
WHERE codigo_inec = '1801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180167');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Unamuncho', '180168' FROM cantones
WHERE codigo_inec = '1801'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180168');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Baños', '180250' FROM cantones
WHERE codigo_inec = '1802'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Lligua', '180251' FROM cantones
WHERE codigo_inec = '1802'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Río Negro', '180252' FROM cantones
WHERE codigo_inec = '1802'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180252');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Río Verde', '180253' FROM cantones
WHERE codigo_inec = '1802'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180253');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Ulba', '180254' FROM cantones
WHERE codigo_inec = '1802'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180254');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cevallos', '180350' FROM cantones
WHERE codigo_inec = '1803'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Mocha', '180450' FROM cantones
WHERE codigo_inec = '1804'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pinguilí', '180451' FROM cantones
WHERE codigo_inec = '1804'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180451');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Patate', '180550' FROM cantones
WHERE codigo_inec = '1805'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180550');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Triunfo', '180551' FROM cantones
WHERE codigo_inec = '1805'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180551');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Los Andes', '180552' FROM cantones
WHERE codigo_inec = '1805'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180552');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sucre', '180553' FROM cantones
WHERE codigo_inec = '1805'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180553');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Quero', '180650' FROM cantones
WHERE codigo_inec = '1806'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180650');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Rumipamba', '180651' FROM cantones
WHERE codigo_inec = '1806'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180651');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Yanayacu Mochapata', '180652' FROM cantones
WHERE codigo_inec = '1806'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180652');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pelileo', '180750' FROM cantones
WHERE codigo_inec = '1807'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180750');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Benítez', '180751' FROM cantones
WHERE codigo_inec = '1807'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180751');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Bolívar', '180752' FROM cantones
WHERE codigo_inec = '1807'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180752');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cotaló', '180753' FROM cantones
WHERE codigo_inec = '1807'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180753');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chiquicha', '180754' FROM cantones
WHERE codigo_inec = '1807'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180754');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Rosario', '180755' FROM cantones
WHERE codigo_inec = '1807'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180755');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'García Moreno', '180756' FROM cantones
WHERE codigo_inec = '1807'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180756');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guambaló', '180757' FROM cantones
WHERE codigo_inec = '1807'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180757');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Salasaca', '180758' FROM cantones
WHERE codigo_inec = '1807'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180758');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Píllaro', '180850' FROM cantones
WHERE codigo_inec = '1808'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180850');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Baquerizo Moreno', '180851' FROM cantones
WHERE codigo_inec = '1808'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180851');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Emilio María Terán', '180852' FROM cantones
WHERE codigo_inec = '1808'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180852');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Marcos Espinel', '180853' FROM cantones
WHERE codigo_inec = '1808'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180853');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Presidente Urbina', '180854' FROM cantones
WHERE codigo_inec = '1808'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180854');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Andrés', '180855' FROM cantones
WHERE codigo_inec = '1808'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180855');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San José de Poaló', '180856' FROM cantones
WHERE codigo_inec = '1808'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180856');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Miguelito', '180857' FROM cantones
WHERE codigo_inec = '1808'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180857');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tisaleo', '180950' FROM cantones
WHERE codigo_inec = '1809'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180950');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Quinchicoto', '180951' FROM cantones
WHERE codigo_inec = '1809'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '180951');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Zamora', '190150' FROM cantones
WHERE codigo_inec = '1901'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cumbaratza', '190151' FROM cantones
WHERE codigo_inec = '1901'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guadalupe', '190152' FROM cantones
WHERE codigo_inec = '1901'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Imbana', '190153' FROM cantones
WHERE codigo_inec = '1901'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sabanilla', '190155' FROM cantones
WHERE codigo_inec = '1901'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190155');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Timbara', '190156' FROM cantones
WHERE codigo_inec = '1901'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190156');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Carlos de Las Minas', '190158' FROM cantones
WHERE codigo_inec = '1901'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190158');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Zumba', '190250' FROM cantones
WHERE codigo_inec = '1902'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chito', '190251' FROM cantones
WHERE codigo_inec = '1902'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Chorro', '190252' FROM cantones
WHERE codigo_inec = '1902'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190252');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Chonta', '190254' FROM cantones
WHERE codigo_inec = '1902'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190254');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pucapamba', '190256' FROM cantones
WHERE codigo_inec = '1902'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190256');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Andrés', '190259' FROM cantones
WHERE codigo_inec = '1902'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190259');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Guayzimi', '190350' FROM cantones
WHERE codigo_inec = '1903'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Zurmi', '190351' FROM cantones
WHERE codigo_inec = '1903'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Nuevo Paraíso', '190352' FROM cantones
WHERE codigo_inec = '1903'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190352');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Nankais', '190353' FROM cantones
WHERE codigo_inec = '1903'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190353');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, '28 de Mayo', '190450' FROM cantones
WHERE codigo_inec = '1904'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Paz', '190451' FROM cantones
WHERE codigo_inec = '1904'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190451');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tutupali', '190452' FROM cantones
WHERE codigo_inec = '1904'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190452');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Yantzaza', '190550' FROM cantones
WHERE codigo_inec = '1905'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190550');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chicaña', '190551' FROM cantones
WHERE codigo_inec = '1905'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190551');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Los encuentros', '190553' FROM cantones
WHERE codigo_inec = '1905'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190553');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Pangui', '190650' FROM cantones
WHERE codigo_inec = '1906'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190650');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Guisme', '190651' FROM cantones
WHERE codigo_inec = '1906'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190651');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pachicutza', '190652' FROM cantones
WHERE codigo_inec = '1906'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190652');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tundayme', '190653' FROM cantones
WHERE codigo_inec = '1906'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190653');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Zumbi', '190750' FROM cantones
WHERE codigo_inec = '1907'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190750');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Triunfo Dorado', '190752' FROM cantones
WHERE codigo_inec = '1907'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190752');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Panguintza', '190753' FROM cantones
WHERE codigo_inec = '1907'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190753');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Palanda', '190850' FROM cantones
WHERE codigo_inec = '1908'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190850');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Porvenir del Carmen', '190851' FROM cantones
WHERE codigo_inec = '1908'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190851');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Francisco del Vergel', '190852' FROM cantones
WHERE codigo_inec = '1908'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190852');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Valladolid', '190853' FROM cantones
WHERE codigo_inec = '1908'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190853');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Canela', '190854' FROM cantones
WHERE codigo_inec = '1908'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190854');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Paquisha', '190950' FROM cantones
WHERE codigo_inec = '1909'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190950');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Bellavista', '190951' FROM cantones
WHERE codigo_inec = '1909'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190951');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Nuevo Quito', '190952' FROM cantones
WHERE codigo_inec = '1909'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '190952');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Puerto Baquerizo Moreno', '200150' FROM cantones
WHERE codigo_inec = '2001'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '200150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Progreso', '200151' FROM cantones
WHERE codigo_inec = '2001'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '200151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Isla Santa María Floreana', '200152' FROM cantones
WHERE codigo_inec = '2001'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '200152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Puerto Villamil', '200250' FROM cantones
WHERE codigo_inec = '2002'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '200250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tomás de Berlanga', '200251' FROM cantones
WHERE codigo_inec = '2002'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '200251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Puerto Ayora', '200350' FROM cantones
WHERE codigo_inec = '2003'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '200350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Bella Vista', '200351' FROM cantones
WHERE codigo_inec = '2003'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '200351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Rosa', '200352' FROM cantones
WHERE codigo_inec = '2003'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '200352');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Nueva Loja', '210150' FROM cantones
WHERE codigo_inec = '2101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Dureno', '210152' FROM cantones
WHERE codigo_inec = '2101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'General Farfán', '210153' FROM cantones
WHERE codigo_inec = '2101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El eno', '210155' FROM cantones
WHERE codigo_inec = '2101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210155');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pacayacu', '210156' FROM cantones
WHERE codigo_inec = '2101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210156');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Jambelí', '210157' FROM cantones
WHERE codigo_inec = '2101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210157');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Cecilia', '210158' FROM cantones
WHERE codigo_inec = '2101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210158');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, '10 de Agosto', '210160' FROM cantones
WHERE codigo_inec = '2101'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210160');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Lumbaquí', '210250' FROM cantones
WHERE codigo_inec = '2102'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Reventador', '210251' FROM cantones
WHERE codigo_inec = '2102'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Gonzalo Pizarro', '210252' FROM cantones
WHERE codigo_inec = '2102'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210252');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Puerto Libre', '210254' FROM cantones
WHERE codigo_inec = '2102'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210254');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Puerto El Carmen de Putumayo', '210350' FROM cantones
WHERE codigo_inec = '2103'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Palma Roja', '210351' FROM cantones
WHERE codigo_inec = '2103'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Puerto Bolívar', '210352' FROM cantones
WHERE codigo_inec = '2103'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210352');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Puerto Rodríguez', '210353' FROM cantones
WHERE codigo_inec = '2103'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210353');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Elena', '210354' FROM cantones
WHERE codigo_inec = '2103'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210354');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sansahuari', '210355' FROM cantones
WHERE codigo_inec = '2103'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210355');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Shushufindi', '210450' FROM cantones
WHERE codigo_inec = '2104'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Limoncocha', '210451' FROM cantones
WHERE codigo_inec = '2104'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210451');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pañacocha', '210452' FROM cantones
WHERE codigo_inec = '2104'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210452');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Roque', '210453' FROM cantones
WHERE codigo_inec = '2104'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210453');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Pedro de los Cofánes', '210454' FROM cantones
WHERE codigo_inec = '2104'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210454');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Siete de Julio', '210455' FROM cantones
WHERE codigo_inec = '2104'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210455');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Bonita', '210550' FROM cantones
WHERE codigo_inec = '2105'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210550');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Playón de San Francisco', '210551' FROM cantones
WHERE codigo_inec = '2105'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210551');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Sofía', '210552' FROM cantones
WHERE codigo_inec = '2105'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210552');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Rosa Florida', '210553' FROM cantones
WHERE codigo_inec = '2105'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210553');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Bárbara', '210554' FROM cantones
WHERE codigo_inec = '2105'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210554');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Dorado de Cascales', '210650' FROM cantones
WHERE codigo_inec = '2106'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210650');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Rosa de Sucumbíos', '210651' FROM cantones
WHERE codigo_inec = '2106'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210651');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Sevilla', '210652' FROM cantones
WHERE codigo_inec = '2106'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210652');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Nueva Troncal', '210653' FROM cantones
WHERE codigo_inec = '2106'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210653');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tarapoa', '210750' FROM cantones
WHERE codigo_inec = '2107'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210750');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cuyabeno', '210751' FROM cantones
WHERE codigo_inec = '2107'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210751');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Aguas Negras', '210752' FROM cantones
WHERE codigo_inec = '2107'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '210752');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Coca', '220150' FROM cantones
WHERE codigo_inec = '2201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Dayuma', '220151' FROM cantones
WHERE codigo_inec = '2201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Taracoa', '220152' FROM cantones
WHERE codigo_inec = '2201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Alejandro Labaka', '220153' FROM cantones
WHERE codigo_inec = '2201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Dorado', '220154' FROM cantones
WHERE codigo_inec = '2201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220154');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Edén', '220155' FROM cantones
WHERE codigo_inec = '2201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220155');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'García Moreno', '220156' FROM cantones
WHERE codigo_inec = '2201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220156');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Inés Arango', '220157' FROM cantones
WHERE codigo_inec = '2201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220157');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Belleza', '220158' FROM cantones
WHERE codigo_inec = '2201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220158');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Nuevo Paraíso', '220159' FROM cantones
WHERE codigo_inec = '2201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220159');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San José de Guayusa', '220160' FROM cantones
WHERE codigo_inec = '2201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220160');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Luis de Armenia', '220161' FROM cantones
WHERE codigo_inec = '2201'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220161');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Nuevo Rocafuerte', '220250' FROM cantones
WHERE codigo_inec = '2202'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Capitán Augusto Rivadeneyra', '220251' FROM cantones
WHERE codigo_inec = '2202'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Cononaco', '220252' FROM cantones
WHERE codigo_inec = '2202'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220252');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa María de Huiririma', '220253' FROM cantones
WHERE codigo_inec = '2202'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220253');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Yasuní', '220255' FROM cantones
WHERE codigo_inec = '2202'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220255');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Joya de los Sachas', '220350' FROM cantones
WHERE codigo_inec = '2203'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'enokanqui', '220351' FROM cantones
WHERE codigo_inec = '2203'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Pompeya', '220352' FROM cantones
WHERE codigo_inec = '2203'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220352');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Carlos', '220353' FROM cantones
WHERE codigo_inec = '2203'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220353');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Sebastián del Coca', '220354' FROM cantones
WHERE codigo_inec = '2203'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220354');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Lago San Pedro', '220355' FROM cantones
WHERE codigo_inec = '2203'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220355');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Rumipamba', '220356' FROM cantones
WHERE codigo_inec = '2203'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220356');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Tres de Noviembre', '220357' FROM cantones
WHERE codigo_inec = '2203'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220357');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Unión Milagreña', '220358' FROM cantones
WHERE codigo_inec = '2203'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220358');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Loreto', '220450' FROM cantones
WHERE codigo_inec = '2204'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220450');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Ávila', '220451' FROM cantones
WHERE codigo_inec = '2204'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220451');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Puerto Murialdo', '220452' FROM cantones
WHERE codigo_inec = '2204'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220452');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San José de Payamino', '220453' FROM cantones
WHERE codigo_inec = '2204'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220453');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San José de Dahuano', '220454' FROM cantones
WHERE codigo_inec = '2204'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220454');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Vicente de Huaticocha', '220455' FROM cantones
WHERE codigo_inec = '2204'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '220455');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santo Domingo de los Colorados', '230150' FROM cantones
WHERE codigo_inec = '2301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '230150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Alluriquín', '230151' FROM cantones
WHERE codigo_inec = '2301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '230151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Puerto Limón', '230152' FROM cantones
WHERE codigo_inec = '2301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '230152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Luz de América', '230153' FROM cantones
WHERE codigo_inec = '2301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '230153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San Jacinto del Búa', '230154' FROM cantones
WHERE codigo_inec = '2301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '230154');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Valle Hermoso', '230155' FROM cantones
WHERE codigo_inec = '2301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '230155');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'El Esfuerzo', '230156' FROM cantones
WHERE codigo_inec = '2301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '230156');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa María del Toachi', '230157' FROM cantones
WHERE codigo_inec = '2301'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '230157');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Concordia', '230250' FROM cantones
WHERE codigo_inec = '2302'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '230250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Monterrey', '230251' FROM cantones
WHERE codigo_inec = '2302'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '230251');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Villegas', '230252' FROM cantones
WHERE codigo_inec = '2302'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '230252');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Plan Piloto', '230253' FROM cantones
WHERE codigo_inec = '2302'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '230253');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Santa Elena', '240150' FROM cantones
WHERE codigo_inec = '2401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '240150');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Atahualpa', '240151' FROM cantones
WHERE codigo_inec = '2401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '240151');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Colonche', '240152' FROM cantones
WHERE codigo_inec = '2401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '240152');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Chanduy', '240153' FROM cantones
WHERE codigo_inec = '2401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '240153');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Manglaralto', '240154' FROM cantones
WHERE codigo_inec = '2401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '240154');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Simón Bolívar', '240155' FROM cantones
WHERE codigo_inec = '2401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '240155');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'San José de Ancón', '240156' FROM cantones
WHERE codigo_inec = '2401'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '240156');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'La Libertad', '240250' FROM cantones
WHERE codigo_inec = '2402'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '240250');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Salinas', '240350' FROM cantones
WHERE codigo_inec = '2403'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '240350');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'Anconcito', '240351' FROM cantones
WHERE codigo_inec = '2403'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '240351');
INSERT INTO parroquias (canton_id, nombre, codigo_inec)
SELECT id, 'José Luis Tamayo', '240352' FROM cantones
WHERE codigo_inec = '2403'
  AND NOT EXISTS (SELECT 1 FROM parroquias WHERE codigo_inec = '240352');

COMMIT;
