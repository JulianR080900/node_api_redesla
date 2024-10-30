import sys
import PyPDF2

def intentar_reparar_pdf(ruta_pdf):
    try:
        # Abrir el PDF dañado
        with open(ruta_pdf, "rb") as archivo:
            lector = PyPDF2.PdfReader(archivo)
            escritor = PyPDF2.PdfWriter()

            # Iterar sobre las páginas y agregar al escritor
            for pagina in lector.pages:
                escritor.add_page(pagina)

            # Guardar el PDF reparado sobrescribiendo el original
            with open(ruta_pdf, "wb") as nuevo_pdf:
                escritor.write(nuevo_pdf)

        print(f"PDF reparado y guardado como: {ruta_pdf}")
    except PyPDF2.errors.PdfReadError as e:
        print(f"Ocurrió un error al leer el PDF: {e}")
    except Exception as e:
        print(f"Ocurrió un error: {e}")


def main():
    if len(sys.argv) < 2:
        print("Se requiere la ruta del archivo PDF como argumento.")
        return

    ruta_pdf_original = sys.argv[1]
    intentar_reparar_pdf(ruta_pdf_original)

if __name__ == "__main__":
    main()
