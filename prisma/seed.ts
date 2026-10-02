/**
 * Semilla de MH Logística a partir de "Directriz 2026 - MH 2026.pdf",
 * la tabla maestra completa que Jaime compartió (115 unidades, una sola
 * fila por equipo con estatus, ciclo de venta, ruta y costos ya juntos).
 * Transcrita a mano con cuidado; el tipo `Row` de abajo obliga a que cada
 * fila tenga exactamente 21 campos (si falta uno, no compila).
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

type Row = [
  number | null, // semana
  string, // equipo
  string, // cliente
  string, // serie
  string, // estatusRaw
  string, // vendedorHist
  string, // compradorHist
  number | null, // ciclo dias
  string, // tipo
  string | null, // fechaEntrega ISO
  string, // mes
  boolean | null, // fleteMex
  string, // origen
  string, // aduana
  string, // documentos
  string, // proveedorCompra
  string, // provFleteUSA
  string, // provAgenteAduanal
  number, // costoFleteUSA
  number, // costoImportacion
  number, // costoFleteMx
];

const ESTATUS_MAP: Record<string, string> = {
  "Entregado": "Entregado",
  "Agencia": "Agencia",
  "Importación / Aduana": "Importación / Aduana",
  "Flete USA": "Flete USA",
  "Parking": "Parking / Patio",
  "Pendiente": "Pendiente",
};

const rows: Row[] = [
  [1,"Trompo Revolvedor 2017 FREIGHTLINER 10.5","Alavaro Leyva","4324","Entregado","Javier","Josue",14,"CAMION","2026-01-04","Enero",true,"Phoenix, AZ","Calexico Ca","S.4324 INVENTARIO","Kit Leasing LLC","MH LOGISTIC","DELIVEGG",601.24,4910.79,4875.10],
  [1,"Grúa Articulada 2005 STERLING 15 ton","Raul Reynaga","2845","Entregado","Javier","Aurelio",17,"CAMION","2026-01-06","Enero",true,"Milwaukee, WI","Laredo Tx","S.2845 INVENTARIO","Motor Vehicle Bill of Sale","MH LOGISTIC","MCA",3286.50,8422.85,3253.28],
  [1,"Elevador 2013 GENIE Z-60/34","Norberto Cervantes","2971","Entregado","Ivan","Josue",23,"AMARILLO","2026-01-06","Enero",true,"Phoenix, AZ","San Diego Ca","S.2971 NORBERTO CERVANTES LANDA","RB Ritchie Bros","EMPORIO AA","EMPORIO",1358.26,2294.42,2625.25],
  [1,"Camión de Volteo 2005 PETERBILT 14m","Miguel Castro","1265","Entregado","Jaime","Josue",30,"CAMION","2026-01-09","Enero",true,"San Antonio, TX","Laredo Tx","S.1265 MIGUEL CASTRO","Auto World Motors","CAP TRUCKING","MCA",906.37,6964.89,3164.50],
  [2,"Trompo Revolvedor 2017 FREIGHTLINER 10.5 yd","Alvaro Leyva","4322","Entregado","Javier","Josue",17,"CAMION","2026-01-13","Enero",true,"Oxford, MA","Calexico Ca","S.4322 INVENTARIO","Kit Leasing LLC","MH LOGISTIC","DELIVEGG",568.19,4940.72,5059.11],
  [2,"Grúa Titán 2001 STERLING 23.5 ton","Miguel Ángel Ramírez","4330","Entregado","Martin","Gleen",30,"CAMION","2026-01-16","Enero",true,"Burnville, NC","Laredo Tx","S.4330 INVENTARIO","Israel Ramirez","MH LOGISTIC","MCA",5806.65,5787.49,5197.31],
  [2,"Montacargas 2014 Moffett M55","Israel Araiza","58","Entregado","Antonio","Aurelio",6,"AMARILLO","2026-01-16","Enero",false,"Lindsay, CA","San Diego Ca","S.0058 ISAAC ARAIZA GAUCIN","Cisneros Farm Labor Services","EMPORIO AA","EMPORIO",1646.59,1900,0],
  [3,"SUPERIOR BROOM DT80 2007","Miguel Castro","6337","Entregado","Jaime","Aurelio",9,"AMARILLO","2026-01-22","Enero",true,"Covington, TN","Laredo Tx","S.6337 MIGUEL CASTRO","Don Baskin Truck Sales LLC","STT LOGISTICS","MCA",2100,3155.12,4313],
  [3,"Tanque de martin","Ricardo Ensenada","N/A","Entregado","Martin","Raul",0,"AMARILLO","2026-01-22","Enero",false,"Mexicali","","","","","",0,0,0],
  [3,"Grúa Titán 2011 INTERNATIONAL 18 ton","Juan Pablo Suastegui","2804","Entregado","Javier","Josue",18,"CAMION","2026-01-22","Enero",true,"Milwaukee, WI","Laredo Tx","S.2804 JUAN PABLO SUASTEGUI","Osborn Roofing Inc.","MH LOGISTIC","MCA",3792.50,7769.51,2937.50],
  [3,"Retroexcavadora 2019 CASE 580N EP","David Armando","227","Entregado","Antonio","Josue",24,"AMARILLO","2026-01-22","Enero",true,"Las Vegas, NV","San Luis Az","","United Rentals","","F3",1300,5264.23,2752],
  [4,"Grúa Titán 1999 Sterling 23 ton","Fabian Chable","7000","Entregado","Antonio","Gleen",19,"CAMION","2026-01-27","Enero",true,"Peoria, AZ","Calexico Ca","S.7000 INVENTARIO","Pes Payne Equipment Sales LLC","MH LOGISTIC","DELIVEGG",705.40,6421.40,3582.17],
  [4,"Retroexcavadora 2006 CATERPILLAR 420D","Eliseo Bustamante","441","Entregado","Martin","Josue",4,"AMARILLO","2026-01-27","Enero",true,"","","","Sin documentos","MH LOGISTIC","",0,0,3597.84],
  [4,"Retroexcavadora 2021 CASE 580N EP","Sebastian Jaramillo","153","Entregado","Ivan","Aurelio",12,"AMARILLO","2026-01-28","Enero",true,"San Diego, CA","Calexico Ca","S.0153 INVENTARIO","Sunstate Equipment Sale","MH LOGISTIC","DELIVEGG",1502.83,5231.62,2859.71],
  [5,"Grúa Titán 2005 PETERBILT 30 ton","Luis Abreu","5217","Entregado","Ivan","Gleen",45,"CAMION","2026-03-12","Marzo",false,"","Calexico Ca","S.5217 INVENTARIO","Aaron Detweiler","MH LOGISTIC","DELIVEGG",0,0,0],
  [5,"Vibrocompactador 1998 CATERPILLAR 815F","Juan Carlos Arvizu","434","Entregado","Jaime","Josue",16,"AMARILLO","2026-02-02","Febrero",true,"Jackson, TN","Laredo Tx","S.0434 JUAN CARLOS ARVIZU RIVERA","Snider Equipment LLC","STT LOGISTICS","MCA",7020.01,10580.30,5524],
  [5,"Bomba de Concreto 2007 MACK 38 m","Ramon De La Mora","5454","Entregado","Martin","Josue",45,"CAMION","2026-03-30","Marzo",true,"Alberta, Canada","Calexico Ca","S.5454 RAMON DE LA MORA","Edgecon Concrete Pumping ltd","MH LOGISTIC","DELIVEGG",0,0,4818],
  [5,"Grúa RT 1998 LINKBELT 65 ton","Gabriel Mijangos","8162","Entregado","Ivan","Josue",49,"AMARILLO","2026-03-05","Marzo",true,"Oakland, CA","Laredo Tx","S.8162 GABRIEL MIJANGOS","California Equipment Company","","MCA",7000,7200,11331.20],
  [5,"Grúa 2005 GROVE 90 ton","Juan Zarate","4155","Entregado","Martin","Aurelio",24,"AMARILLO","2026-02-23","Febrero",true,"Chantilly, VA","Laredo Tx","S.4155 JUAN ZARATE HDEZ","Blue Ridge Iron, LLC","SJW DISPATCH","MCA",16248.90,12646.80,7355],
  [5,"Trompo Revolvedor 2017 FREIGHTLINER 10.5","Inventario","4319","Entregado","Javier","Josue",0,"CAMION","2026-05-16","Mayo",true,"Phoenix, AZ","Calexico Ca","S.4319 INVENTARIO","Sin documentos","MH LOGISTIC","DELIVEGG",760.24,0,7027],
  [5,"Grúa Articulada 2008 STERLING 4.5 ton","kevin Jahir Peredo","8916","Entregado","Alejandro","Josue",20,"CAMION","2026-02-21","Febrero",true,"Covington, TN","Laredo Tx","S.8916 KEVIN JAHIR PEREDO TORRES","Don Baskin Truck Sales LLC","MH LOGISTIC","MCA",2621.06,7458.09,3687.86],
  [5,"Grúa Articulada 2016 FREIGTHLINER 10 ton","Juan Carlos Vasquez","1787","Entregado","Javier","Aurelio",68,"CAMION","2026-06-18","Junio",true,"","Laredo Tx","S.1787 INVENTARIO","bidadoo Auctions","SJW DISPATCH","MCA",9398,7784,7694],
  [5,"Grúa Articulada 2007 STERLING 15 ton","Raul Reynaga","8983","Entregado","Javier","Josue",23,"CAMION","2026-02-27","Febrero",true,"New Berlin, WI","Laredo Tx","S.8983 RAUL REYNAGA REYNAGA","Elite Logistics LLC","MH LOGISTIC","MCA",3240.79,7881.16,5411.54],
  [5,"Retro Excavadora Case 580N 2020","Rey Cabrera","257","Entregado","Antonio","Raul",9,"AMARILLO","2026-02-20","Febrero",true,"Sun City, CA","San Luis Az","S.0257 REY CABRERA","United Rentals","MACHINERY TRACKING","F3",810,4921.05,1699.42],
  [6,"Grúa Titán 2011 PETERBILT 23 ton","Francisco Alfredo Huguez","2866","Entregado","Jaime","Josue",83,"CAMION","2026-05-06","Mayo",true,"Artesia, NM","Calexico Ca","S.2866 INVENTARIO","Purple Wave Inc","MH LOGISTIC","DELIVEGG",0,0,2812],
  [6,"Grúa Titán 2007 STERLING 30 ton","Juan Lopez Barboza","6470","Entregado","Antonio","Gleen",16,"CAMION","2026-03-18","Marzo",true,"Alberta, Canada","Calexico Ca","S.6470 JUAN LOPEZ BARBOZA","Prairie Demolition y Recycling","SJW DISPATCH","DELIVEGG",6600,5973.97,4830],
  [6,"Grúa Titán 2006 Peterbilt 20 ton","Jose Roberto Cruz","7732","Entregado","Martin","Gleen",34,"CAMION","2026-03-26","Marzo",true,"Seattle, WA","Calexico Ca","S.7732 JOSE ROBERTO CRUZ","SQI Inc","MH LOGISTIC","DELIVEGG",3634.02,5277.04,4314],
  [6,"Vibrocompactador 2006 INGERSOLL","Carlos Gutierrez","9610","Entregado","Ivan","Josue",4,"AMARILLO","2026-02-13","Febrero",true,"","","","","","",0,0,959],
  [6,"Grúa Titán 2000 Sterling 23 ton","Ricardo Pichardo","3075","Entregado","Ivan","Josue",39,"CAMION","2026-03-28","Marzo",false,"Atlanta, GA","San Luis Az","S.3075 INVENTARIO","Crane Monsters Corp","MACHINERY TRACKING","F3",4308.03,5625.08,0],
  [7,"Camión de Volteo 2011 INTERNATIONAL 7m","Jesus Vazquez","9575","Entregado","Javier","Aurelio",38,"CAMION","2026-03-17","Marzo",true,"San Antonio, TX","Laredo Tx","S.9575 JESUS VAZQUEZ","Auto World Motors","CAP TRUCKING","MCA",924.46,6879.68,1332.59],
  [7,"Grúa Articulada 2011 Peterbilt 10 ton","Humberto Martinez","2731","Entregado","Martin","Aurelio",24,"CAMION","2026-03-17","Marzo",true,"Salt Lake City, UT","Calexico Ca","S.2731 Humberto Martinez","Ritchie Bros Iron Planet","MH LOGISTIC","DELIVEGG",1939.31,6483.30,253.09],
  [7,"Tractor Agrícola 2015 JOHN DEERE","Manuel Everardo","1669","Entregado","Javier","Gleen",7,"AMARILLO","2026-02-26","Febrero",true,"Susanville, CA","","","Aaron Detweiler","SJW DISPATCH","CEA",1804,952.67,1552.11],
  [7,"Retroexcavadora 2019 CASE 580N EP","Manuel Fernandez","291","Entregado","Alejandro","Josue",7,"AMARILLO","2026-03-18","Marzo",false,"Bullhead City, AZ","Laredo Tx","S.0291 INVENTARIO","United Rentals","CAP TRUCKING","MCA",1010,5284.64,0],
  [7,"Camión Plataforma 2014 FORD 14 ft","Israel Morales","3227","Entregado","Martin","Josue",77,"CAMION","2026-04-11","Abril",true,"Sacramento, CA","Calexico Ca","S.3227 ISRAEL MORALES","Bar None Auction","CAP TRUCKING","DELIVEGG",1800,4100,3976],
  [8,"Grua Titan 2007 Sterling 23.5 ton","Jose Aceves","2389","Entregado","Ivan","Josue",15,"CAMION","2026-03-13","Marzo",true,"Lamar, MO","Laredo Tx","S.2389 INVENTARIO","Don Duncan","MH LOGISTIC","MCA",2275,5270.20,3276.84],
  [8,"Retro de Consignacion","Roberto Elias","0","Entregado","Javier","Aurelio",3,"AMARILLO","2026-02-28","Febrero",false,"","","","","","MCA",0,0,0],
  [9,"Grúa Articulada 2018 FREIGTHLINER 10 ton","Martin Peña","4703","Entregado","Raul","Aurelio",62,"CAMION","2026-03-23","Marzo",true,"Chicopee, MA","Laredo Tx","S.4703 MARTIN PENA","Baskin's, Inc","MH LOGISTIC","MCA",5050.76,8967.24,3220.43],
  [9,"2011 Wailer E1250","karim Sanchez","1088","Entregado","Alejandro","Josue",43,"AMARILLO","2026-04-08","Abril",true,"Newman, GA","Laredo Tx","S.1088 KARIM SANCHEZ","Ritchie Bros. Auctioneers","STT LOGISTICS","MCA",7500,7024.10,4090.15],
  [9,"Cargador frontal 2021 Caterpillar 908 m","Efren Fuentes","4907","Entregado","Antonio","Josue",36,"AMARILLO","2026-06-15","Junio",true,"Davenport, FL","Laredo Tx","S.4907 EFREN FUENTES ARENAS","Ritchie Bros. Auctioneers","STT LOGISTICS","MCA",5000,7750,4498.56],
  [9,"Minicargador Case TR310B","Roberto Elias","8038","Entregado","Javier/Antonio","Josue",41,"AMARILLO","2026-03-20","Marzo",true,"Manor, TX","Laredo Tx","S.8038 ROBERTO ELIAS","ASCO Equipment","SJW DISPATCH","MCA",750,4300,1882.25],
  [9,"Grúa Titán 2007 STERLING 23 ton","Javier Navarrete","2379","Entregado","Javier","Gleen",32,"CAMION","2026-04-04","Abril",true,"","Calexico Ca","S.2379 INVENTARIO","RK Builders LLC","MH LOGISTIC","DELIVEGG",5434.11,5961.54,4275.40],
  [10,"Grua Titan 2007 Sterling 35 ton","Pedro Sanchez Toral","1560","Entregado","Ivan","Aurelio",95,"CAMION","2026-05-09","Mayo",true,"Montreal, Canada","El Paso Tx","S.1560 PEDRO SANCHEZ TORAL","Super Equipment INC","MH LOGISTIC","SECORTECH",10936.40,7721.01,1150.16],
  [11,"Vibracompactador CATERPILLAR 836G","Juan Carlos Arvizu","432","Entregado","Antonio","Josue",71,"AMARILLO","2026-05-31","Mayo",true,"Ball Ground, GA","Laredo Tx","S.0432 JUAN CARLOS ARVIZU RIVERA","Ritchie Bros Iron Planet","EXPRESSWAY LOGISTICS","MCA",28400,10935,12079],
  [11,"Accesorio","Juan Antonio Mendoza","S/N","Entregado","Jaime","Jaime",null,"AMARILLO","2026-03-23","Marzo",true,"","Calexico Ca","","Ritchie Bros. Auctioneers","MH LOGISTIC","DELIVEGG",1506.11,9485.62,2664],
  [11,"Agricola 2018 John Deere Tractor","Noe del Angel Salas","1622","Entregado","Josue","Josue",31,"AMARILLO","2026-04-12","Abril",true,"Huntsville, TX","Laredo Tx","S.1622 NOE DEL ANGEL SALAS","Purchase Agreement","EXPRESSWAY LOGISTICS","MCA",1444.31,2062.40,3184.42],
  [11,"Bomba de Concreto 2005 MACK 39m","Inventario","7022","Entregado","Antonio","Josue",21,"CAMION","2026-04-20","Abril",true,"Forth Worth, TX","El Paso Tx","S.7022 INVENTARIO","alliance","MH LOGISTIC","SECORTECH",3484.49,7864.52,3568.28],
  [11,"Grúa Articulada 2016 FREIGTHLINER 5.2 ton","Victor Lazaro Rodriguez","9891","Entregado","Antonio","Aurelio",25,"CAMION","2026-04-25","Abril",true,"Reese, MI","El Paso Tx","S.9891 VICTOR LAZARO","List Trucks and Equipment Sales, Inc","MH LOGISTIC","SECORTECH",7561.07,7599.31,4854.37],
  [12,"Bomba de Concreto 2012 Mack 32 m","Adrian Garcia","224","Entregado","Ivan","Aurelio",41,"CAMION","2026-06-02","Junio",true,"Dunnigan, CA","Calexico Ca","S.0224 INVENTARIO","Ritchie Bros. Auctioneers","MH LOGISTIC","DELIVEGG",2049.64,6659.99,6252.69],
  [12,"Grúa Articulada","Pascual Vargas","4720","Entregado","Ivan","Jaime",33,"CAMION","2026-04-19","Abril",true,"Elton, LA","El Paso Tx","S.4720 PASCUAL VARGAS","B IronPlanet, Inc.","MH LOGISTIC","SECORTECH",7031,6831.23,3150.06],
  [13,"Agrícola 2022 John Deere Other","Inventario","3692","Entregado","Jaime","Josue",24,"AMARILLO","2026-04-12","Abril",false,"Fredericksburg, TX","Laredo Tx","S.3692 INVENTARIO","Vogel Tractors LLC","MH LOGISTIC","MCA",0,500,0],
  [13,"2008 CANYON 6897913 Engine 3.7L","Miguel Castro","3504","Entregado","Aurelio","Jaime",30,"AMARILLO","2026-04-16","Abril",false,"Plantsville, CT","Laredo Tx","","EBAY","EBAY","MCA",0,1286.24,0],
  [14,"Excavadora 2018 CATERPILLAR 349FL","Roberto Silveyra","326","Entregado","Josue","Josue",35,"AMARILLO","2026-05-15","Mayo",true,"Mc Allen, TX","Laredo Tx","S.0326 ROBERTO SILVEYRA","Black Mountain Machinery, Inc.","BASER FREIGTH LLC","MCA",2900.01,14788.08,13354],
  [16,"Grúa Titán 2001 Peterbilt 26 ton","Brandon Tryana","9162","Entregado","Javier","Gleen",40,"CAMION","2026-04-30","Abril",true,"Manheim, PA","El Paso Tx","S.9162 INVENTARIO","Crane Specilists, INC","MH LOGISTIC","SECORTECH",5535.40,7134.70,2277.78],
  [16,"Grúa Articulada 2015 FREIGHTLINER 10 ton","Juan Carlos Fuentes","9133","Entregado","Javier","Josue",33,"CAMION","2026-05-10","Mayo",true,"Rifle, CO","San Luis Az","S.9133 INVENTARIO","Gov Deals","MH LOGISTIC","F3",2868.07,7482.99,3668.28],
  [16,"Grúa Articulada 2006 INTERNATIONAL 12 ton","Luis Alcocer","6761","Entregado","Ivan","Josue",35,"CAMION","2026-05-24","Mayo",true,"Goldendale, WA","Calexico Ca","S.6761 LUIS ALCOCER","Mountain View Excavation, Inc","MH LOGISTIC","DELIVEGG",3988.18,6200,7264.25],
  [16,"Grúa Todo Terreno 2012 GROVE 225 ton","Emmanuel González","3040","Entregado","Martin","Aurelio",22,"CAMION","2026-06-06","Junio",false,"Lewisville, TX","Laredo Tx","S.3040 EMMANUEL GONZALEZ","Crane Btda Sales & Rentals, LLC.","EXPRESSWAY LOGISTICS","MCA",9240,33340.80,0],
  [16,"Grúa Articulada 2016 FREIGHTLINER 10 ton","David Armando","1805","Entregado","Antonio","Josue",33,"CAMION","2026-05-23","Mayo",true,"Hesperia, CA","San Luis Az","S.1805 DAVID ARMANDO FLORES","Bidadoo","MH LOGISTIC","F3",850.06,6047.43,5909.16],
  [17,"Grúa Titán 2014 KENWORTH 26 ton","Inventario","9434","Entregado","Ivan","Aurelio",77,"CAMION","2026-06-25","Junio",true,"Kent, WA","Calexico Ca","S.9434 INVENTARIO","Bidadoo","MH LOGISTIC","DELIVEGG",3968.30,6060.93,5289.54],
  [17,"Grúa RT 2016 Manitex 15 ton","Jaime Noe Mora","3012","Entregado","Ivan","Josue",49,"AMARILLO","2026-05-18","Mayo",true,"Irving, TX","El Paso Tx","S.3012 JAIME NOE MORA","Texas Capital Investments","CAP TRUCKING","SECORTECH",3110,7462.69,10274.10],
  [18,"Roll Off 2007 STERLING lbs","Edrei Mendez","5971","Entregado","Aurelio","Aurelio",112,"AMARILLO","2026-07-21","Julio",true,"Hidalgo, TX","El Paso Tx","S.5971 EDREI MENDEZ","B Truck Center","MH LOGISTIC","SECORTECH",3371.73,6926.35,2816.40],
  [18,"Grúa Canastilla 2016 FORD 40 ft","Sebastián Jaramillo","6795","Entregado","Aurelio","Aurelio",45,"CAMION","2026-05-11","Mayo",true,"Houston, TX","El Paso Tx","S.6795 SEBASTIAN JARAMILLO","BUYER'S ORDER","MH LOGISTIC","SECORTECH",2309.30,6544.20,2873.56],
  [18,"Grúa Todo Terreno 2009 GROVE 249 ton","Christian Ramos","3085","Entregado","Josue","Josue",97,"CAMION","2026-06-12","Junio",true,"Stockton, CA","Calexico Ca","","Omnia Machinery U.S.A, Inc","EXPRESSWAY LOGISTICS","DELIVEGG",13650,14198.90,18552],
  [19,"Trompo Revolvedor 2007 KENWORTH 11 yd","Almazan Cruz","6150","Entregado","Martin","Aurelio",35,"CAMION","2026-08-01","Agosto",false,"Houston, TX","El Paso Tx","S.6150 ALMAZAN CRUZ","WORLDWIDE TRUCKS, LLC","EXPRESSWAY LOGISTICS","SECORTECH",7470,8517.57,0],
  [19,"Trompo Revolvedor 2009 KENWORTH 11 yd","Almazan Cruz","6671","Entregado","Martin","Aurelio",35,"CAMION","2026-08-01","Agosto",false,"Houston, TX","El Paso Tx","S.6671 ALMAZAN CRUZ","WORLDWIDE TRUCKS, LLC","EXPRESSWAY LOGISTICS","SECORTECH",6400,8333.30,0],
  [19,"Trompo Revolvedor 2009 KENWORTH 11 yd","Almazan Cruz","2862","Entregado","Aurelio","Aurelio",32,"CAMION","2026-06-05","Junio",false,"Houston, TX","El Paso Tx","S.2862 ALMAZAN CRUZ","WORLDWIDE TRUCKS, LLC","MH LOGISTIC","SECORTECH",413.20,6823.39,255.68],
  [19,"Grúa Titán 2004 Sterling 23 ton","Raul Reynaga","342","Entregado","Gleen","Gleen",31,"CAMION","2026-06-05","Junio",true,"Redding, CA","Calexico Ca","S.0342 INVENTARIO","REDDING CRANE SERVICE","MH LOGISTIC","DELIVEGG",2636.40,6113.01,5841.05],
  [19,"Grúa Articulada 2015 VOLVO 10 ton","Hugo Hernandez","1901","Entregado","Josue","Josue",35,"CAMION","2026-05-30","Mayo",true,"Mobile, AL","El Paso Tx","S.1901 INVENTARIO","Bidadoo","MH LOGISTIC","SECORTECH",3843.21,7876,5325],
  [19,"Grúa Articulada 2016 FREIGTHLINER 10 ton","Ernesto Espejel","1810","Entregado","Aurelio","Aurelio",30,"CAMION","2026-06-05","Junio",true,"Bend, OR","El Paso Tx","S.1810 INVENTARIO","Bidadoo","MH LOGISTIC","SECORTECH",4908.29,7819.63,4017.50],
  [20,"Grúa Articulada 2010 FREIGTHLINER 10 ton","Jose Botello","9334","Entregado","Aurelio","Aurelio",27,"CAMION","2026-06-21","Junio",true,"Clackamas, OR","San Luis Az","","Bidadoo","MH LOGISTIC","F3",4344.17,6039.95,5099.42],
  [21,"Grúa Articulada 2016 FREIGHTLINER 10 ton","Inventario","3470","Entregado","Josue","Josue",34,"CAMION","2026-06-09","Junio",true,"St Louis, MO","El Paso Tx","S.3470 INVENTARIO","Bidadoo","MH LOGISTIC","SECORTECH",3544.20,7824.10,3352.27],
  [21,"Retroexcavadora 2021 CASE 580N EP","Inventario","40","Entregado","Javier","Aurelio",33,"AMARILLO","2026-06-16","Junio",true,"Corpus Christi, TX","Laredo Tx","S.0040 INVENTARIO","Bidadoo","EXPRESSWAY LOGISTICS","MCA",910,7207,3815.49],
  [22,"Grúa Articulada 2015 FREIGTHLINER 5 ton","Hector Trejo","9556","Entregado","Aurelio","Aurelio",26,"CAMION","2026-07-01","Julio",true,"Cedar Rapids, IA","El Paso Tx","S.9556 HECTOR TREJO MARTINEZ","Bidadoo","EXPRESSWAY LOGISTICS","SECORTECH",5800,8499,3370.15],
  [22,"Grúa Articulada 2005 STERLING 15 ton","Jose Castañeda","1220","Entregado","Jaime","Josue",60,"CAMION","2026-06-15","Junio",true,"Carrollton, GA","Laredo Tx","","OEY MARTIN AUCTIONEERS, LLC","MH LOGISTIC","SECORTECH",3724.12,7142.98,4430.46],
  [22,"Grúa Titán 2005 STERLING 28 ton","Edgar Rios","4080","Entregado","Antonio","Aurelio",65,"CAMION","2026-06-24","Junio",true,"Orlando, FL","El Paso Tx","S.4080 EDGAR RIOS","TIP TOP ROOFING COMPANY, INC.","MH LOGISTIC","SECORTECH",4681.16,7858.70,3323.37],
  [22,"Grúa Titán 2007 PETERBILT 28 ton","Inventario (Gladys Gonzalez)","8785","Entregado","Antonio","Josue",null,"CAMION","2026-09-05","Septiembre",true,"Hutto, TX","Calexico Ca","","jeff martin auctioneers inc.","MH LOGISTIC","F3",8066.75,6106.68,4770.22],
  [24,"Grúa Titán 2012 INTERNATIONAL 26 ton","Raul Reynaga","2189","Entregado","Aurelio","Aurelio",40,"CAMION","2026-07-02","Julio",true,"Thonotosassa, TX","San Luis Az","S.2189 INVENTARIO","J.J. Kane","MH LOGISTIC","SECORTECH",5273,7580,4091.81],
  [24,"Bomba de Concreto 2014 MACK 40 m","Enrique Salazar","987","Entregado","Aurelio","Aurelio",44,"CAMION","2026-07-04","Julio",true,"Columbus, OH","El Paso Tx","","AINSWORTH INTERNATIONAL LLC","MH LOGISTIC","SECORTECH",6800,9649,3050],
  [24,"Grúa Titán 2005 STERLING 23 ton","Alfredo Sanchez","7194","Entregado","Aurelio","Aurelio",52,"CAMION","2026-07-17","Julio",true,"Dunnigan, CA","Calexico Ca","S.7194 INVENTARIO","IronPlanet, Inc.","MH LOGISTIC","DELIVEGG",2926.55,6586.19,4522.18],
  [26,"Grúa Articulada 2015 FREIGHTLINER 10 ton","Victor Lazaro Rodriguez","9336","Entregado","Antonio","Josue",64,"CAMION","2026-07-30","Julio",true,"Norfolk, VA","El Paso Tx","S.9336 VICTOR LAZARO RODRIGUEZ","Bidadoo","MH LOGISTIC","SECORTECH",5539.53,7300,4185],
  [26,"Grúa Articulada 2005 STERLING 12 ton","Inventario (Jose Aceves)","5078","Entregado","Ivan","Josue",48,"CAMION","2026-07-30","Julio",true,"Pitt Meadows, BC","Calexico Ca","S.5078","ROBERT PEKARI","MH LOGISTIC","CEA",1500,5500,6640],
  [26,"Retroexcavadora 2006 Cat 416D","Julio Cesar Tovar","6694","Entregado","Antonio","Josue",25,"AMARILLO","2026-07-25","Julio",true,"Humble, TX","Laredo Tx","S.6694","RB. Auctioneers (America) Inc.","BASER FREIGTH LLC","MCA",1500,6490.11,4850],
  [26,"Retroexcavadora 2017 Case 580N EP","Luis Bastidas","263","Entregado","Martin","Aurelio",24,"AMARILLO","2026-07-19","Julio",true,"Bemidji, MN","Laredo Tx","S.0263","Grand True Value Rental","EXPRESSWAY LOGISTICS","MCA",3400,6188.40,0],
  [26,"Cableadora estacionaria","Brandon Triana","","Entregado","Javier","",null,"AMARILLO","2026-06-25","Junio",false,"","","Servicio logístico","Compro Cliente","","SECORTECH",0,1993.30,0],
  [27,"Montacargas 2022 CASE 588H MH136337","Jaime Noe Mora","8375","Entregado","Ivan","Josue",37,"AMARILLO","2026-07-15","Julio",true,"Yuma, AZ","San Luis Az","S.8375 JAIME NOE MORA","bingham Equipament Company","MACHINERY TRACKING","F3",400,5700,4313],
  [28,"Grúa Titán 2000 Sterling 30 ton","Inventario (Isac solis)","4874","Entregado","Ivan","Gleen",35,"CAMION","2026-08-14","Agosto",true,"Elkford, BC","Calexico Ca","S.4874 Isac Solis","RMR","MH LOGISTIC","CEA",3500,6006,6909.91],
  [28,"Grúa Articulada 2015 FREIGHTLINER 10 ton","David Armando Flores","8477","Entregado","Antonio","Josue",37,"CAMION","2026-07-23","Julio",true,"Laredo, TX","El Paso Tx","S.8477 DAVID ARMANDO FLORES GONZALEZ","Bidadoo","MH LOGISTIC","SECORTECH",1990,7281,3500],
  [28,"Montacargas 2008 Princeton E50S","Mario Fabela","5014","Entregado","Antonio","Aurelio",26,"AMARILLO","2026-08-14","Agosto",true,"Arlington, TX","El Paso Tx","S.5014 Mario Fabela","AARON CASTELO","EXPRESSWAY LOGISTICS","SECORTECH",2300,3100,2321.71],
  [28,"Camión 2016 INTERNATIONAL LF687","Jose Botello","1411","Entregado","Javier","Josue",52,"CAMION","2026-08-29","Agosto",true,"Lancaster, CA","Calexico Ca","S.1411 JOSE BOTELLO","R,B TRUCK PLANET","MH LOGISTIC","F3",1100,9700,5104],
  [29,"Grúa Titán 2006 INTERNATIONAL 18 ton","Carlos Ontiveros","2596","Entregado","Ivan","Josue",29,"CAMION","2026-07-22","Julio",true,"Compton, CA","Calexico Ca","","","","MCA",0,0,4813],
  [29,"Grúa Titán 2003 Sterling 22 ton","Inventario","8855","Agencia","Ivan","Gleen",null,"CAMION",null,"",true,"Fairview, PA","Calexico Ca","S.8855 INVENTARIO","Bartlett Sings Inc.","MH LOGISTIC","DELIVEGG",12872,6659,0],
  [29,"Grúa Titán 2011 International 36 ton","Eleazar nolasco","3548","Entregado","Antonio","Gleen",46,"CAMION","2026-09-18","Septiembre",true,"Fairview, PA","Calexico Ca","","Bartlett Sings Inc.","MH LOGISTIC","DELIVEGG",1099,6732,0],
  [29,"Elevador 2016 SKYJACK SJ63AJ","Raul Reynaga","869","Entregado","Javier","Josue",15,"AMARILLO","2026-08-11","Agosto",true,"San Antonio, TX","Laredo Tx","S.0869 Reynaga","AUTOS WORLD MOTORS","EXPRESSWAY LOGISTICS","MCA",1050,4650,2909.23],
  [31,"Grúa Articulada 2016 FREIGHTLINER 10 ton","Mario Dominguez","1797","Entregado","Javier","Josue",23,"CAMION","2026-08-22","Agosto",true,"Burlington, NC","El Paso Tx","S.1797 Mario Dominguez","R,B IRON PLANET","MH LOGISTIC","SECORTECH",7050,7850,5054.82],
  [33,"Grúa Titán 2001 Sterling 23 ton","Inventario","3272","Agencia","","",null,"CAMION",null,"",true,"Hibbing, MI","Calexico Ca","","UBB","EXPRESSWAY LOGISTICS","DELIVEGG",0,0,0],
  [34,"Grúa Titán 1998 Ford 21 ton","Adolfo Hernandez","1671","Entregado","Angel","Gleen",18,"CAMION","2026-09-05","Septiembre",true,"London, OH","El Paso Tx","S.1671 Adolfo Hernandez","Prairie Creek","MH LOGISTIC","SECORTECH",760.91,6213.54,4275],
  [34,"Bomba de Concreto 2015 MACK 38 m","Victor Hugo Perez","1968","Entregado","Antonio","Josue",16,"CAMION","2026-09-08","Septiembre",true,"Charlotte, NC","El Paso Tx","S.1968 Bomba de concreto","Ainsworth International LLC","MH LOGISTIC","SECORTECH",7300,10950,5810],
  [34,"Cargador Frontal 1998 CATERPILLAR 950G","Jesus Uribe","306","Entregado","Javier","Josue",12,"AMARILLO","2026-09-08","Septiembre",true,"Van Alstyne, TX","El Paso Tx","S.0306 Cargador Frontal 950G","Himes Equipment LLC","EXPRESSWAY LOGISTICS","SECORTECH",2738.03,6450,7012],
  [34,"Grúa Articulada 2011 INTERNATIONAL 10 ton","Ruben De la Rosa","6662","Entregado","Antonio","Josue",27,"CAMION","2026-09-15","Septiembre",true,"Myerstown, PA","El Paso Tx","S.6662 Ruben DLR","Best Used Trucks Of PA, INC.","MH LOGISTIC","SECORTECH",7500,7100,5364.40],
  [34,"Retroexcavadora 2021 Case 580NEP","Agustin Chavez","331","Entregado","Angel","Aurelio",20,"AMARILLO","2026-09-11","Septiembre",false,"Corpus Christi, TX","Laredo Tx","S.0331","R,B IRON PLANET","EXPRESSWAY LOGISTICS","MCA",1600,6900,0],
  [34,"Excavadora","Roberto Silveyra","4020","Entregado","Ivan","Jaime",4,"AMARILLO","2026-08-22","Agosto",true,"Clymer, NY","","Servicio logístico","","CAP TRUCKING","",0,0,5715],
  [29,"Camion Ford L9000","Ramiro Molina","7764","Entregado","Jaime","Jaime",31,"CAMION","2026-08-27","Agosto",false,"Ellenboro, WV","El Paso Tx","Servicio logístico","","EXPRESSWAY LOGISTICS","SECORTECH",4500,5200,0],
  [35,"Grúa Canastilla 2016 Ford 45 ft","Victor Landero","1815","Entregado","Martin","Aurelio",22,"CAMION","2026-09-20","Septiembre",true,"Moscow Mills, MO","El Paso Tx","S.1815 VICTOR LANDEROS","Fruendly Auto Source INC","MH LOGISTIC","SECORTECH",4400,7000,5943],
  [35,"Retroexcavadora 2014 CASE 580SN","Antonio Guzman","6398","Entregado","Angel","Josue",16,"AMARILLO","2026-09-17","Septiembre",true,"Grand Saline, TX","Laredo Tx","S.6398","Iron Ranch LLC","EXPRESSWAY LOGISTICS","MCA",2800,6500,3423.48],
  [36,"Grúa Articulada 2016 FREIGHTLINER 10 ton","Gustavo Jacome","1783","Importación / Aduana","Antonio","Josue",null,"CAMION",null,"",true,"Clarksville, MD","El Paso Tx","","R,B IRON PLANET","MH LOGISTIC","SECORTECH",7000,8000,0],
  [36,"Accesorio PATEZCA","Eleazar Nolasco","1953","Importación / Aduana","Antonio","Josue",null,"AMARILLO",null,"",true,"Syracuse, NY","El Paso Tx","","The Empire Crane Co. LLC","MH LOGISTIC","SECORTECH",3600,1950,0],
  [36,"Grúa Titán 2006 Sterling 28 ton","Jose Luis Martinez","8505","Entregado","Ivan","Aurelio",12,"CAMION","2026-09-25","Septiembre",true,"Salt Lake City, UT","Calexico Ca","","WGC LLC","EMPORIO AA","MCA",2900,6800,4905],
  [36,"Trituradora","Jose Gonzalez","","Entregado","Angel","Raul",19,"AMARILLO","2026-09-21","Septiembre",true,"","El Paso Tx","Cliente recogerá la unidad","","EXPRESSWAY LOGISTICS","SECORTECH",9250,5950,0],
  [38,"Grúa Articulada 2018 Freightliner 10 ton","Daniel Flores","3816","Importación / Aduana","Javier","Aurelio",null,"CAMION",null,"",true,"Kansas City, MO","El Paso Tx","","","MH LOGISTIC","SECORTECH",3600,7400,0],
  [38,"Trompo Revolvedor 2007 PETERBILT 10 yd","Inventario","9698","Parking","","",null,"CAMION",null,"",true,"Humble, TX","El Paso Tx","","","MH LOGISTIC","SECORTECH",0,0,0],
  [38,"Grúa Canastilla 2019 FORD 40 ft","Inventario","2165","Importación / Aduana","","",null,"CAMION",null,"",true,"Perris, CA","San Luis Az","","","MH LOGISTIC","DELIVEGG",0,0,0],
  [38,"Elevador 2018 Genie GS1930","Inventario","5511","Importación / Aduana","","",null,"AMARILLO",null,"",true,"Perris, CA","Calexico Ca","","","EXPRESSWAY LOGISTICS","F3",925,0,0],
  [39,"Grúa Titán 1999 Sterling 25 ton","Inventario","2817","Flete USA","","",null,"CAMION",null,"",true,"Vaughan, Ontario","El Paso Tx","","","MH LOGISTIC","SECORTECH",0,0,0],
  [39,"Camión de Volteo 2012 FREIGHTLINER 14m","Norberto Aguila","1265","Agencia","","",null,"CAMION",null,"",null,"","","","","","",0,0,0],
  [39,"Grúa Titán 2015 FORD 18 ton","Inventario","397","Parking","","",null,"CAMION",null,"",true,"Phoenix, AZ","Calexico Ca","","","EXPRESSWAY LOGISTICS","DELIVEGG",0,0,0],
  [40,"Grúa Titán 2005 Sterling 23 ton","Inventario","265","Pendiente","","",null,"CAMION",null,"",true,"Las Vegas, NV","Calexico Ca","","","MH LOGISTIC","DELIVEGG",0,0,0],
];

// Unidades que Jaime marcó con una fecha concreta de movimiento en
// "incidencias" -> se usan para el recordatorio de "salidas de hoy".
const FECHA_SALIDA_POR_SERIE: Record<string, string> = {
  "1783": "2026-09-30",
  "1953": "2026-09-30",
  "3816": "2026-10-05",
  "2165": "2026-09-30",
  "5511": "2026-09-30",
  "265": "2026-09-30",
};

function folio(n: number) {
  return `MH-2026-${String(n).padStart(4, "0")}`;
}

async function main() {
  console.log("Limpiando datos anteriores...");
  await prisma.comment.deleteMany();
  await prisma.paymentOrder.deleteMany();
  await prisma.statusEvent.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.costoHistorico.deleteMany();
  await prisma.shipment.deleteMany();

  console.log(`Cargando ${rows.length} unidades reales...`);
  let n = 0;
  for (const r of rows) {
    n += 1;
    const [
      semana, equipo, cliente, serie, estatusRaw, vendedorHist, compradorHist,
      ciclo, tipo, fechaISO, mes, fleteMex, origen, aduana, documentos,
      proveedorCompra, provFleteUSA, provAgenteAduanal, costoFleteUSA,
      costoImportacion, costoFleteMx,
    ] = r;

    const estatus = ESTATUS_MAP[estatusRaw] ?? "Pendiente";
    const fechaEntrega = estatus === "Entregado" && fechaISO ? new Date(fechaISO) : null;
    const fechaSalidaProgramada = FECHA_SALIDA_POR_SERIE[serie]
      ? new Date(FECHA_SALIDA_POR_SERIE[serie])
      : null;

    // "Reloj": si se conoce el ciclo real (tal como lo trae el PDF) y la
    // fecha de entrega, se calcula hacia atrás la fecha de inicio para que
    // sea consistente con el dato de ciclo que Jaime ya lleva. Si no, se
    // estima con la semana del año (su propia forma de organizar el año).
    const inicioPorSemana = semana
      ? new Date(Date.UTC(2026, 0, 1 + (semana - 1) * 7))
      : null;
    const fechaInicio =
      fechaEntrega && ciclo != null
        ? new Date(fechaEntrega.getTime() - ciclo * 86400000)
        : inicioPorSemana;

    const shipment = await prisma.shipment.create({
      data: {
        folio: folio(n),
        semana: semana ?? undefined,
        fechaInicio: fechaInicio ?? undefined,
        equipoDescripcion: equipo,
        cliente,
        serie: serie || "S/N",
        estatus,
        tipoUnidad: tipo || undefined,
        origenCiudad: origen || undefined,
        aduana: aduana || undefined,
        documentos: documentos || undefined,
        proveedorCompra: proveedorCompra || undefined,
        provFleteUSA: provFleteUSA || undefined,
        provAgenteAduanal: provAgenteAduanal || undefined,
        costoFleteUSA,
        costoImportacion,
        costoFleteMx,
        fleteMexAplica: fleteMex ?? true,
        fechaEntrega,
        fechaSalidaProgramada,
        mesVenta: mes || undefined,
        tiempoCicloDias: ciclo ?? undefined,
      },
    });

    await prisma.statusEvent.create({
      data: {
        shipmentId: shipment.id,
        estatusNuevo: estatus,
        usuario: "Importación inicial",
        comentario: "Cargado desde Directriz 2026 - MH 2026.pdf",
        fecha: fechaEntrega ?? fechaInicio ?? new Date(),
      },
    });

    if (vendedorHist || compradorHist) {
      await prisma.sale.create({
        data: {
          shipmentId: shipment.id,
          vendedor: vendedorHist || "Sin especificar",
          comprador: compradorHist || undefined,
          tipoUnidad: tipo || undefined,
          tiempoCicloDias: ciclo ?? undefined,
          fecha: fechaEntrega,
          mes: mes || undefined,
          anio: 2026,
          fleteMex: fleteMex ?? true,
          origenDato: "historico-pdf",
        },
      });
    }
  }

  console.log("Listo ✔  —", rows.length, "unidades cargadas.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
