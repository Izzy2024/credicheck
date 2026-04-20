import { Shield, Search, User, AlertTriangle, CheckCircle, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function StyleGuide() {
  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">CrediCheck - Guía de Estilo</h1>
        <p className="text-lg text-slate-600">Sistema de diseño para la aplicación SaaS de consulta crediticia</p>
      </div>

      {/* Paleta de Colores */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Paleta de Colores</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Colores Primarios */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-700">Colores Primarios</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-800 rounded-lg shadow-sm"></div>
                <div>
                  <p className="font-medium text-slate-800">Azul Oscuro Principal</p>
                  <p className="text-sm text-slate-600">#1e293b</p>
                  <p className="text-xs text-slate-500">slate-800</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-cyan-500 rounded-lg shadow-sm"></div>
                <div>
                  <p className="font-medium text-slate-800">Turquesa Acento</p>
                  <p className="text-sm text-slate-600">#06b6d4</p>
                  <p className="text-xs text-slate-500">cyan-500</p>
                </div>
              </div>
            </div>
          </div>

          {/* Colores Neutros */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-700">Colores Neutros</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-50 border rounded-lg shadow-sm"></div>
                <div>
                  <p className="font-medium text-slate-800">Fondo Claro</p>
                  <p className="text-sm text-slate-600">#f8fafc</p>
                  <p className="text-xs text-slate-500">slate-50</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white border rounded-lg shadow-sm"></div>
                <div>
                  <p className="font-medium text-slate-800">Blanco</p>
                  <p className="text-sm text-slate-600">#ffffff</p>
                  <p className="text-xs text-slate-500">white</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-500 rounded-lg shadow-sm"></div>
                <div>
                  <p className="font-medium text-slate-800">Gris Texto</p>
                  <p className="text-sm text-slate-600">#64748b</p>
                  <p className="text-xs text-slate-500">slate-500</p>
                </div>
              </div>
            </div>
          </div>

          {/* Colores de Estado */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-700">Colores de Estado</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500 rounded-lg shadow-sm"></div>
                <div>
                  <p className="font-medium text-slate-800">Éxito</p>
                  <p className="text-sm text-slate-600">#10b981</p>
                  <p className="text-xs text-slate-500">emerald-500</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500 rounded-lg shadow-sm"></div>
                <div>
                  <p className="font-medium text-slate-800">Error/Peligro</p>
                  <p className="text-sm text-slate-600">#ef4444</p>
                  <p className="text-xs text-slate-500">red-500</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500 rounded-lg shadow-sm"></div>
                <div>
                  <p className="font-medium text-slate-800">Advertencia</p>
                  <p className="text-sm text-slate-600">#f97316</p>
                  <p className="text-xs text-slate-500">orange-500</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tipografía */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Tipografía</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Familia de Fuentes</h3>
            <p className="text-slate-600 mb-2">
              <strong>Fuente Principal:</strong> Inter (sans-serif)
            </p>
            <p className="text-slate-600">Fuente moderna, legible y optimizada para interfaces digitales</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-700">Jerarquía Tipográfica</h3>

            <div className="space-y-4 p-6 bg-white rounded-lg border">
              <div>
                <h1 className="text-4xl font-bold text-slate-800">Título Principal (H1)</h1>
                <p className="text-sm text-slate-500 mt-1">text-4xl font-bold</p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-800">Título Secundario (H2)</h2>
                <p className="text-sm text-slate-500 mt-1">text-2xl font-bold</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-800">Título Terciario (H3)</h3>
                <p className="text-sm text-slate-500 mt-1">text-xl font-semibold</p>
              </div>

              <div>
                <h4 className="text-lg font-medium text-slate-800">Subtítulo (H4)</h4>
                <p className="text-sm text-slate-500 mt-1">text-lg font-medium</p>
              </div>

              <div>
                <p className="text-base text-slate-700">Párrafo Normal</p>
                <p className="text-sm text-slate-500 mt-1">text-base</p>
              </div>

              <div>
                <p className="text-sm text-slate-600">Texto Pequeño</p>
                <p className="text-sm text-slate-500 mt-1">text-sm</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Texto Extra Pequeño</p>
                <p className="text-sm text-slate-500 mt-1">text-xs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Iconografía */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Iconografía</h2>

        <div className="space-y-4">
          <p className="text-slate-600">
            <strong>Librería de Iconos:</strong> Lucide React
          </p>
          <p className="text-slate-600">Estilo consistente de líneas finas (outline) con grosor de 1.5px</p>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-6 bg-white rounded-lg border">
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-50">
              <Shield className="w-6 h-6 text-slate-700" />
              <span className="text-xs text-slate-600">Shield</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-50">
              <Search className="w-6 h-6 text-slate-700" />
              <span className="text-xs text-slate-600">Search</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-50">
              <User className="w-6 h-6 text-slate-700" />
              <span className="text-xs text-slate-600">User</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-50">
              <AlertTriangle className="w-6 h-6 text-slate-700" />
              <span className="text-xs text-slate-600">Alert</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-50">
              <CheckCircle className="w-6 h-6 text-slate-700" />
              <span className="text-xs text-slate-600">Check</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-50">
              <CreditCard className="w-6 h-6 text-slate-700" />
              <span className="text-xs text-slate-600">Credit</span>
            </div>
          </div>
        </div>
      </section>

      {/* Componentes */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Componentes Principales</h2>

        <div className="space-y-8">
          {/* Botones */}
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Botones</h3>
            <div className="flex flex-wrap gap-4 p-6 bg-white rounded-lg border">
              <Button className="bg-slate-800 hover:bg-slate-700 text-white">Primario</Button>
              <Button variant="outline">Secundario</Button>
              <Button variant="ghost">Fantasma</Button>
              <Button disabled>Deshabilitado</Button>
            </div>
          </div>

          {/* Cards */}
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Tarjetas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Tarjeta Estándar</CardTitle>
                  <CardDescription>Descripción de la tarjeta</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">Contenido de la tarjeta con información relevante.</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Tarjeta Destacada</CardTitle>
                  <CardDescription>Con mayor elevación</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">Tarjeta con sombra más pronunciada para destacar.</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Estados de Alerta */}
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Estados de Alerta</h3>
            <div className="space-y-4">
              <Alert className="border-emerald-200 bg-emerald-50">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-800">
                  Mensaje de éxito - Operación completada correctamente
                </AlertDescription>
              </Alert>

              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">Mensaje de error - Se encontró un problema</AlertDescription>
              </Alert>

              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Mensaje de advertencia - Información importante
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </section>

      {/* Espaciado y Layout */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Espaciado y Layout</h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Espaciado Estándar</h3>
            <ul className="text-slate-600 space-y-1">
              <li>
                <strong>Pequeño:</strong> 0.5rem (8px) - gap-2, p-2
              </li>
              <li>
                <strong>Mediano:</strong> 1rem (16px) - gap-4, p-4
              </li>
              <li>
                <strong>Grande:</strong> 1.5rem (24px) - gap-6, p-6
              </li>
              <li>
                <strong>Extra Grande:</strong> 2rem (32px) - gap-8, p-8
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Contenedores</h3>
            <ul className="text-slate-600 space-y-1">
              <li>
                <strong>Máximo ancho:</strong> max-w-4xl (896px) para formularios
              </li>
              <li>
                <strong>Máximo ancho:</strong> max-w-6xl (1152px) para dashboards
              </li>
              <li>
                <strong>Máximo ancho:</strong> max-w-7xl (1280px) para layouts amplios
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Principios de Diseño */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Principios de Diseño</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Minimalismo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Cada elemento debe tener un propósito claro. Evitar el desorden visual y mantener interfaces limpias.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Consistencia</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Usar patrones consistentes en toda la aplicación para crear una experiencia predecible.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Accesibilidad</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Mantener buen contraste, usar etiquetas semánticas y proporcionar feedback visual claro.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Profesionalismo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Transmitir confianza y seriedad apropiadas para una aplicación financiera empresarial.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
