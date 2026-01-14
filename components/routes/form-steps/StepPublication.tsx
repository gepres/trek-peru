'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff, Link as LinkIcon, FileText } from 'lucide-react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { RouteFormInput } from '@/lib/validations/route.schema';

interface StepPublicationProps {
  register: UseFormRegister<RouteFormInput>;
  errors: FieldErrors<RouteFormInput>;
  watch: UseFormWatch<RouteFormInput>;
  setValue: UseFormSetValue<RouteFormInput>;
}

export function StepPublication({ register, errors, watch, setValue }: StepPublicationProps) {
  const status = watch('status');
  const visibility = watch('visibility');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>3. Publicación</CardTitle>
          <CardDescription>
            Define el estado y la visibilidad de tu ruta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estado */}
          <div className="space-y-2">
            <Label htmlFor="status" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Estado de la Ruta <span className="text-destructive">*</span>
            </Label>
            <Select
              defaultValue={status}
              onValueChange={(value: any) => setValue('status', value)}
            >
              <SelectTrigger className={errors.status ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecciona estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                    <div>
                      <div className="font-medium">Borrador</div>
                      <div className="text-xs text-muted-foreground">
                        Solo tú puedes verla
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="published">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <div>
                      <div className="font-medium">Publicada</div>
                      <div className="text-xs text-muted-foreground">
                        Visible y abierta a inscripciones
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="cancelled">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <div>
                      <div className="font-medium">Cancelada</div>
                      <div className="text-xs text-muted-foreground">
                        No se realizará
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <div>
                      <div className="font-medium">Completada</div>
                      <div className="text-xs text-muted-foreground">
                        Ya se realizó
                      </div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>

          {/* Visibilidad */}
          <div className="space-y-2">
            <Label htmlFor="visibility" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visibilidad <span className="text-destructive">*</span>
            </Label>
            <Select
              defaultValue={visibility}
              onValueChange={(value: any) => setValue('visibility', value)}
            >
              <SelectTrigger className={errors.visibility ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecciona visibilidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="font-medium">Pública</div>
                      <div className="text-xs text-muted-foreground">
                        Visible para todos en búsquedas y listados
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="link">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="font-medium">Solo con enlace</div>
                      <div className="text-xs text-muted-foreground">
                        Solo accesible con el link directo
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">Privada</div>
                      <div className="text-xs text-muted-foreground">
                        Solo tú puedes verla
                      </div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.visibility && (
              <p className="text-sm text-destructive">{errors.visibility.message}</p>
            )}
          </div>

          {/* Info box */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Recomendación:</strong> Guarda tu ruta como{' '}
              <span className="text-foreground font-medium">Borrador</span> mientras la completas.
              Cuando esté lista, cámbiala a{' '}
              <span className="text-foreground font-medium">Publicada</span> para que otros
              puedan inscribirse.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
