"use client"
import { type FormikProps, Form } from "formik"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, ArrowRight, ArrowLeft, ShieldCheck, Car, Thermometer, Wind, Lightbulb, Tractor } from "lucide-react"
import { FileUpload } from "@/components/ui/file-upload"
import { Separator } from "@/components/ui/separator"

interface PasoCondicionVehiculoProps {
  formik: FormikProps<any>
  onPrevious: () => void
  actualizarDatos: (datos: any) => void
}

export default function PasoCondicionVehiculo({ formik, onPrevious, actualizarDatos }: PasoCondicionVehiculoProps) {
  const handleVehicleConditionChange = (value: string) => {
    let currentConditions = [...formik.values.vehicleConditions]

    if (value === "none") {
      // Si selecciona "Ninguna de las opciones", desmarcar todas las demás
      formik.setFieldValue("vehicleConditions", ["none"])
      return
    }

    // Si ya está seleccionado, quitarlo
    if (currentConditions.includes(value)) {
      currentConditions = currentConditions.filter((item) => item !== value)
    } else {
      // Si no está seleccionado, agregarlo y quitar "none" si está seleccionado
      currentConditions = currentConditions.filter((item) => item !== "none")
      currentConditions.push(value)
    }

    formik.setFieldValue("vehicleConditions", currentConditions)
  }

  const handleSafetyItemChange = (value: string) => {
    let currentItems = [...formik.values.safetyItems]

    if (value === "none") {
      // Si selecciona "Não possuo nenhum dos itens acima", desmarcar todas las demás
      formik.setFieldValue("safetyItems", ["none"])
      return
    }

    // Si ya está seleccionado, quitarlo
    if (currentItems.includes(value)) {
      currentItems = currentItems.filter((item) => item !== value)
    } else {
      // Si no está seleccionado, agregarlo y quitar "none" si está seleccionado
      currentItems = currentItems.filter((item) => item !== "none")
      currentItems.push(value)
    }

    formik.setFieldValue("safetyItems", currentItems)
  }

  const vehicleConditionOptions = [
    { id: "theft", label: "Histórico de roubo e furto" },
    { id: "armored", label: "É blindado" },
    { id: "gas", label: "Tem Kit gás (GNV)" },
    { id: "structural", label: "Dano estrutural" },
    { id: "auction", label: "Já teve passagem por leilão" },
    { id: "crash", label: "Já teve batida" },
    { id: "modified", label: "Possui modificação na estrutura" },
    { id: "lowered", label: "Rebaixado" },
    { id: "performance", label: "Alterações de performance (escape, remap, etc.)" },
    { id: "none", label: "Nenhuma das opções acima" },
  ]

  const safetyItemOptions = [
    { id: "wrench", label: "Chave de roda" },
    { id: "spare", label: "Estepe" },
    { id: "triangle", label: "Triângulo" },
    { id: "jack", label: "Macaco" },
    { id: "none", label: "Não possuo nenhum dos itens acima" },
  ]

  const showSafetyItemsPhoto = formik.values.safetyItems.length > 0 && !formik.values.safetyItems.includes("none");
  const showWindshieldPhoto = formik.values.hasWindshieldDamage === "sim";
  const showLightsPhoto = formik.values.hasLightsDamage === "sim";
  const showTiresPhoto = formik.values.hasTiresDamage === "sim";
  const showConditionsDescription = formik.values.vehicleConditions.length > 0 && 
                                    !formik.values.vehicleConditions.includes("none");

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="bg-black text-white p-6">
        <CardTitle className="text-2xl font-bold flex items-center">
          <Car className="mr-2 h-5 w-5" />
          Condições do Veículo
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form className="space-y-8">
          {/* Sección: Características del vehículo */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Car className="h-5 w-5 text-blue-700" />
              <h3 className="text-lg font-medium">Características do Veículo</h3>
            </div>
            <Separator className="my-4" />

          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">O seu veículo possui alguma das características abaixo?*</Label>
              <div className="mt-3 space-y-3">
                {vehicleConditionOptions.map((option) => (
                  <div key={option.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={`condition-${option.id}`}
                      checked={formik.values.vehicleConditions.includes(option.id)}
                      onCheckedChange={() => handleVehicleConditionChange(option.id)}
                      disabled={
                        (option.id !== "none" && formik.values.vehicleConditions.includes("none")) ||
                        (option.id === "none" &&
                          formik.values.vehicleConditions.length > 0 &&
                          !formik.values.vehicleConditions.includes("none"))
                      }
                    />
                    <Label
                      htmlFor={`condition-${option.id}`}
                      className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
              {formik.touched.vehicleConditions && formik.errors.vehicleConditions && (
                <div className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formik.errors.vehicleConditions}
                </div>
              )}
            </div>

              {/* Campo condicional para descripción */}
              {showConditionsDescription && (
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                  <Label className="text-base font-medium">
                    Descreva brevemente a(s) condição(ões) marcada(s) acima:
                  </Label>
                  <textarea
                    className="mt-2 w-full min-h-[100px] p-3 border border-gray-300 rounded-md"
                    placeholder="Por favor, forneça detalhes sobre as características selecionadas..."
                    name="conditionDescription"
                    value={formik.values.conditionDescription || ""}
                    onChange={formik.handleChange}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sección: Itens de Segurança */}
          <div className="space-y-6 pt-4">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-blue-700" />
              <h3 className="text-lg font-medium">Itens de Segurança</h3>
            </div>
            <Separator className="my-4" />

            <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Quais itens de segurança o veículo possui?*</Label>
              <div className="mt-3 space-y-3">
                {safetyItemOptions.map((option) => (
                  <div key={option.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={`safety-${option.id}`}
                      checked={formik.values.safetyItems.includes(option.id)}
                      onCheckedChange={() => handleSafetyItemChange(option.id)}
                        disabled={
                          (option.id !== "none" && formik.values.safetyItems.includes("none")) ||
                          (option.id === "none" &&
                            formik.values.safetyItems.length > 0 &&
                            !formik.values.safetyItems.includes("none"))
                        }
                    />
                    <Label
                      htmlFor={`safety-${option.id}`}
                      className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
              {formik.touched.safetyItems && formik.errors.safetyItems && (
                <div className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formik.errors.safetyItems}
                </div>
              )}
            </div>

              {/* Campo condicional para foto de ítems de seguridad */}
              {showSafetyItemsPhoto && (
            <div className="space-y-2">
              <Label className="text-base font-medium">Foto dos itens de segurança*</Label>
              <FileUpload
                accept={{
                  "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
                }}
                maxSize={10 * 1024 * 1024} // 10MB
                onFileChange={(file) => {
                  if (file) {
                    const objectUrl = URL.createObjectURL(file)
                    formik.setFieldValue("safetyItemsPhoto", file)
                    formik.setFieldValue("safetyItemsPhotoUrl", objectUrl)
                    // Validar el formulario después de cambiar el valor
                    formik.validateForm().then(() => {
                      formik.setTouched({
                        ...formik.touched,
                        safetyItemsPhoto: true,
                      })
                    })
                  } else {
                    formik.setFieldValue("safetyItemsPhoto", null)
                    formik.setFieldValue("safetyItemsPhotoUrl", "")
                  }
                }}
                value={formik.values.safetyItemsPhoto}
                previewUrl={formik.values.safetyItemsPhotoUrl}
                error={
                  formik.touched.safetyItemsPhoto && formik.errors.safetyItemsPhoto
                    ? String(formik.errors.safetyItemsPhoto)
                    : undefined
                }
                fileType="image"
                label="Clique para fazer upload da foto dos itens de segurança"
              />
            </div>
              )}
            </div>
          </div>

          {/* Sección: Más condiciones */}
          <div className="space-y-6 pt-4">
            <div className="flex items-center space-x-2">
              <Thermometer className="h-5 w-5 text-blue-700" />
              <h3 className="text-lg font-medium">Funcionamento e Condições</h3>
            </div>
            <Separator className="my-4" />

            <div className="space-y-6">
            <div className="space-y-2">
                <Label className="text-base font-medium">O ar-condicionado está gelando?*</Label>
              <RadioGroup
                name="hasAirConditioner"
                value={formik.values.hasAirConditioner}
                onValueChange={(value) => formik.setFieldValue("hasAirConditioner", value)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sim" id="ac-sim" />
                  <Label htmlFor="ac-sim">Sim</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nao" id="ac-nao" />
                  <Label htmlFor="ac-nao">Não</Label>
                </div>
              </RadioGroup>
              {formik.touched.hasAirConditioner && formik.errors.hasAirConditioner && (
                <div className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formik.errors.hasAirConditioner}
                </div>
              )}
            </div>

            <div className="space-y-2">
                <Label className="text-base font-medium">O para-brisa apresenta algum tipo de avaria?*</Label>
              <RadioGroup
                name="hasWindshieldDamage"
                value={formik.values.hasWindshieldDamage}
                onValueChange={(value) => formik.setFieldValue("hasWindshieldDamage", value)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sim" id="windshield-sim" />
                  <Label htmlFor="windshield-sim">Sim</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nao" id="windshield-nao" />
                  <Label htmlFor="windshield-nao">Não</Label>
                </div>
              </RadioGroup>
              {formik.touched.hasWindshieldDamage && formik.errors.hasWindshieldDamage && (
                <div className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formik.errors.hasWindshieldDamage}
                </div>
              )}
            </div>

              {/* Campo condicional para foto de parabrisas */}
              {showWindshieldPhoto && (
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200 space-y-2">
                  <Label className="text-base font-medium">Foto do para-brisa*</Label>
                <FileUpload
                  accept={{
                    "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
                  }}
                  maxSize={10 * 1024 * 1024} // 10MB
                  onFileChange={(file) => {
                    if (file) {
                      const objectUrl = URL.createObjectURL(file)
                      formik.setFieldValue("windshieldPhoto", file)
                      formik.setFieldValue("windshieldPhotoUrl", objectUrl)
                      formik.validateForm().then(() => {
                        formik.setTouched({
                          ...formik.touched,
                          windshieldPhoto: true,
                        })
                      })
                    } else {
                      formik.setFieldValue("windshieldPhoto", null)
                      formik.setFieldValue("windshieldPhotoUrl", "")
                    }
                  }}
                  value={formik.values.windshieldPhoto}
                  previewUrl={formik.values.windshieldPhotoUrl}
                  error={
                    formik.touched.windshieldPhoto && formik.errors.windshieldPhoto
                      ? String(formik.errors.windshieldPhoto)
                      : undefined
                  }
                  fileType="image"
                  label="Clique para fazer upload da foto do para-brisa"
                />
              </div>
            )}

            <div className="space-y-2">
                <Label className="text-base font-medium">
                  Os faróis dianteiros, lanternas traseiras ou retrovisores estão danificados ou quebrados?*
                </Label>
              <RadioGroup
                name="hasLightsDamage"
                value={formik.values.hasLightsDamage}
                onValueChange={(value) => formik.setFieldValue("hasLightsDamage", value)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sim" id="lights-sim" />
                  <Label htmlFor="lights-sim">Sim</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nao" id="lights-nao" />
                  <Label htmlFor="lights-nao">Não</Label>
                </div>
              </RadioGroup>
              {formik.touched.hasLightsDamage && formik.errors.hasLightsDamage && (
                <div className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formik.errors.hasLightsDamage}
                </div>
              )}
            </div>

              {/* Campo condicional para foto de luces */}
              {showLightsPhoto && (
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200 space-y-2">
                  <Label className="text-base font-medium">Foto dos itens com danos*</Label>
                <FileUpload
                  accept={{
                    "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
                  }}
                  maxSize={10 * 1024 * 1024} // 10MB
                  onFileChange={(file) => {
                    if (file) {
                      const objectUrl = URL.createObjectURL(file)
                      formik.setFieldValue("lightsPhoto", file)
                      formik.setFieldValue("lightsPhotoUrl", objectUrl)
                      formik.validateForm().then(() => {
                        formik.setTouched({
                          ...formik.touched,
                          lightsPhoto: true,
                        })
                      })
                    } else {
                      formik.setFieldValue("lightsPhoto", null)
                      formik.setFieldValue("lightsPhotoUrl", "")
                    }
                  }}
                  value={formik.values.lightsPhoto}
                  previewUrl={formik.values.lightsPhotoUrl}
                  error={
                    formik.touched.lightsPhoto && formik.errors.lightsPhoto
                      ? String(formik.errors.lightsPhoto)
                      : undefined
                  }
                  fileType="image"
                    label="Clique para fazer upload da foto dos itens com danos"
                />
              </div>
            )}

            <div className="space-y-2">
                <Label className="text-base font-medium">
                  Os pneus (incluindo o estepe) apresentam bolhas, cortes ou desgaste irregular?*
                </Label>
              <RadioGroup
                name="hasTiresDamage"
                value={formik.values.hasTiresDamage}
                onValueChange={(value) => formik.setFieldValue("hasTiresDamage", value)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sim" id="tires-sim" />
                  <Label htmlFor="tires-sim">Sim</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nao" id="tires-nao" />
                  <Label htmlFor="tires-nao">Não</Label>
                </div>
              </RadioGroup>
              {formik.touched.hasTiresDamage && formik.errors.hasTiresDamage && (
                <div className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formik.errors.hasTiresDamage}
                </div>
              )}
            </div>

              {/* Campo condicional para foto de neumáticos */}
              {showTiresPhoto && (
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200 space-y-2">
                <Label className="text-base font-medium">Foto dos pneus*</Label>
                <FileUpload
                  accept={{
                    "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
                  }}
                  maxSize={10 * 1024 * 1024} // 10MB
                  onFileChange={(file) => {
                    if (file) {
                      const objectUrl = URL.createObjectURL(file)
                      formik.setFieldValue("tiresPhoto", file)
                      formik.setFieldValue("tiresPhotoUrl", objectUrl)
                      formik.validateForm().then(() => {
                        formik.setTouched({
                          ...formik.touched,
                          tiresPhoto: true,
                        })
                      })
                    } else {
                      formik.setFieldValue("tiresPhoto", null)
                      formik.setFieldValue("tiresPhotoUrl", "")
                    }
                  }}
                  value={formik.values.tiresPhoto}
                  previewUrl={formik.values.tiresPhotoUrl}
                  error={
                      formik.touched.tiresPhoto && formik.errors.tiresPhoto
                        ? String(formik.errors.tiresPhoto)
                        : undefined
                  }
                  fileType="image"
                  label="Clique para fazer upload da foto dos pneus"
                />
              </div>
            )}

            <div className="space-y-2">
                <Label className="text-base font-medium">O sistema de som/multimídia é original do veículo?*</Label>
              <RadioGroup
                name="hasOriginalSoundSystem"
                value={formik.values.hasOriginalSoundSystem}
                onValueChange={(value) => formik.setFieldValue("hasOriginalSoundSystem", value)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sim" id="sound-sim" />
                  <Label htmlFor="sound-sim">Sim</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nao" id="sound-nao" />
                  <Label htmlFor="sound-nao">Não</Label>
                </div>
              </RadioGroup>
              {formik.touched.hasOriginalSoundSystem && formik.errors.hasOriginalSoundSystem && (
                <div className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {formik.errors.hasOriginalSoundSystem}
                </div>
              )}
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-between">
            <Button type="button" variant="outline" onClick={onPrevious}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? (
                "Processando..."
              ) : (
                <>
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  )
}
