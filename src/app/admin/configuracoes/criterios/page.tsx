import { listarCriterios } from '@/actions/criterios'
import { CriteriosList } from '@/components/criterios/criterios-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Info } from 'lucide-react'

export default async function CriteriosPage() {
  const criterios = await listarCriterios()

  const vaquejada = criterios.filter(c => c.tipo_prova === 'vaquejada')
  const tambor = criterios.filter(c => c.tipo_prova === 'tambor')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Critérios de Pontuação</h1>
        <p className="text-sm text-gray-500 mt-1">
          Critérios padrão usados para pontuar passadas. Cada modalidade pode sobrescrever o peso individualmente.
        </p>
      </div>

      <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          Alterar critérios aqui afeta novas passadas. Passadas já registradas mantêm os dados originais em <code>detalhes_json</code>.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Vaquejada
              <span className="text-sm font-normal text-gray-400">{vaquejada.length} critérios</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CriteriosList tipoProva="vaquejada" criterios={vaquejada} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Tambor
              <span className="text-sm font-normal text-gray-400">{tambor.length} critérios</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CriteriosList tipoProva="tambor" criterios={tambor} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
