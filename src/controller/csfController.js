import fs from "fs";
import { PdfReader } from "pdfreader";
import { spawn } from "child_process";

const repararPDF = (pdfPath) => {
  return new Promise((resolve, reject) => {
    const process = spawn("python", ["./py/repair_file.py", pdfPath]);

    process.stdout.on("data", (data) => {
      console.log(data.toString());
    });

    // Manejar errores
    process.stderr.on("data", (data) => {
      console.error(`Error: ${data}`);
      reject(data.toString());
    });

    // Manejar la finalización del proceso
    process.on("close", (code) => {
      if (code === 0) {
        console.log(`Proceso de reparación finalizado con código: ${code}`);
        resolve(pdfPath); // Devuelve la misma ruta si se ha reparado correctamente
      } else {
        reject(`Proceso finalizado con código: ${code}`);
      }
    });
  });
};

const initFile = async (pdfPath) => {
  let fullText = ""; // Almacenar texto extraído

  await new Promise((resolve, reject) => {
    const pdfReader = new PdfReader();

    pdfReader.parseFileItems(pdfPath, async (err, item) => {
      if (err) {
        console.log("Reparando PDF...");

        try {
          await repararPDF(pdfPath); // Llamamos a la función con su argumento
          resolve(true); // Resolución tras la reparación
        } catch (repairError) {
          console.error("Error al reparar el PDF:", repairError);
          reject(repairError); // Rechaza en caso de error durante la reparación
        }
      } else if (!item) {
        // Fin del archivo PDF
        resolve(true); // Resolver con el texto acumulado
      } else if (item.text) {
        resolve(true); // Resolver con el texto acumulado
      }
    });
  });
};

const readCSF = async (req, res) => {
  if (!req.file) {
    return res.status(500).json({ error: "Archivo no proporcionado" });
  }

  const pdfPath = req.file.path;

  try {
    console.log("Iniciando lectura...");
    await initFile(pdfPath); // Obtén el texto completo del PDF
    console.log("Lectura completada.");
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error procesando el archivo PDF", detalle: error });
  }

  const pdfReader = new PdfReader();

  let fullText = "";
  pdfReader.parseFileItems(pdfPath, async (err, item) => {
    if (err) {
      console.error(`Error al leer el archivo: ${pdfPath}`);
    } else if (!item) {
      console.log("Archivo bien estructurado");
      const info = procesarPDFReparado(fullText, res, pdfPath);
      res.json(info);
      return;
    } else if (item.text) {
      fullText += item.text + " "; // Acumula el texto con un espacio entre líneas
    }
  });
};

const procesarPDFReparado = (fullText, res, pdfPath) => {
  const keysToExtract = {
    curp: /CURP:\s*([A-Z0-9]{18})/,
    rfc: /RFC:\s(.*?)CURP:/i,
    /* nombre: /Nombre\s\(s\):\s(.*?)Primer\sApellido/i,
    PrimerApellido: /Primer Apellido:\s*([A-ZÁÉÍÓÚÑ]+)/,
    SegundoApellido: /Segundo Apellido:\s*([A-ZÁÉÍÓÚÑ]+)/, */
    cp: /Código Postal:\s*([0-9]{5})/,
    vialidad: /Nombre de Vialidad:\s(.*?)Número/i,
    noInt: /Número\sInterior:\s(.*?)Nombre/i,
    noExt: /Número\sExterior:\s(.*?)Número/i,
    colonia: /Colonia:\s(.*?)Nombre/i,
    localidad: /Nombre\sde\sla\sLocalidad:\s(.*?)Nombre/i,
    estado: /Nombre\sde\sla\sEntidad\sFederativa:\s(.*?)Entre Calle/i,
    municipio: /Nombre\sdel\sMunicipio\so\sDemarcación\sTerritorial:\s(.*?)Nombre/i,
    razons: /Registro\sFederal\sde\sContribuyentes\s(.*?)Nombre/i,
  };

  const fiscalInfo = {};

  for (const [key, regex] of Object.entries(keysToExtract)) {
    const match = fullText.match(regex);
    if (match) {
      const cleanValue = match[1].trim();
      fiscalInfo[key] = cleanValue; // Guardar valor encontrado sin espacios adicionales
    }
  }

  if (fullText.match(/Regímenes:\s+(.*)/)) {
    let arr_regimenes = [];
    let regimenes;
    if (
      fullText.match(/Régimen\sFecha\sInicio\sFecha\sFin\s(.*?)Obligaciones:/i)
    ) {
      regimenes = fullText.match(
        /Régimen\sFecha\sInicio\sFecha\sFin\s(.*?)Obligaciones:/i
      );
    } else {
      regimenes = fullText.match(
        /Régimen\sFecha\sInicio\sFecha\sFin\s(.*?)Sus datos/i
      );
    }

    regimenes = regimenes[1];

    const partes = regimenes.split(/(\d{2}\/\d{2}\/\d{4})/);

    const regimenesv2 = partes
      .map((parte, index) => {
        if (index % 2 === 0) {
          return parte.trim(); // Retornamos solo la parte que no contiene fechas
        }
      })
      .filter(Boolean);

    const resultados = regimenesv2;

    fiscalInfo["regimenes"] = resultados;
  } else {
    fiscalInfo["regimenes"] = "";
  }

  if(!fiscalInfo['rfc']) {
    const regex = /RFC:\s(.*?)Denominación\/Razón/i;
    const match = fullText.match(regex);    

    if(match) {
      const cleanValue = match[1].trim();
      fiscalInfo['rfc'] = cleanValue; // Guardar valor encontrado sin espacios adicionales
    }

  }

  fiscalInfo["pais"] = 2;

  // Mover la eliminación del archivo aquí, después de que se haya procesado
  fs.unlinkSync(pdfPath);
  return fiscalInfo;
};

export default { readCSF };
