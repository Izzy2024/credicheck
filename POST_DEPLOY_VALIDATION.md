# Post-deploy validation - CrediCheck

## 1. Salud básica

### Backend
Verificar:

```bash
curl -sS https://api.tudominio.com/health
```

Esperado:
- HTTP 200
- `success: true`
- database status connected

### Frontend
Abrir:
- `https://tudominio.com`

Esperado:
- carga sin error
- sin pantalla rota
- sin error de hydration visible

## 2. Validación funcional mínima

### Público
- [ ] Home carga
- [ ] Dashboard público carga
- [ ] Búsqueda pública responde
- [ ] Resultados encontrados / no encontrados funcionan

### Auth
- [ ] Login correcto con usuario válido
- [ ] Login inválido devuelve error controlado
- [ ] Logout funciona
- [ ] Refresh token funciona indirectamente en sesión real si aplica

### Usuario autenticado
- [ ] Profile carga
- [ ] Profile update funciona
- [ ] Feature center carga
- [ ] History carga
- [ ] Notifications carga
- [ ] My records carga si aplica
- [ ] Disputes carga si aplica

### Admin
- [ ] Admin dashboard carga
- [ ] Admin records carga
- [ ] Admin settings carga
- [ ] Admin disputes carga
- [ ] Moderation carga si aplica

## 3. Validación técnica

- [ ] No errores 500 en logs al navegar flujos principales
- [ ] No errores de CORS
- [ ] No errores de conexión frontend-backend
- [ ] No errores de migración
- [ ] No errores de base de datos en arranque

## 4. Validación de seguridad mínima

- [ ] NODE_ENV realmente es production
- [ ] Secrets no son valores de ejemplo
- [ ] CORS está limitado al dominio real
- [ ] Health endpoint responde correctamente
- [ ] Login rate limit está activo en producción

## 5. Logs a revisar

Buscar especialmente:
- errores 500
- errores de Prisma
- JWT inválidos inesperados en masa
- fallos de conexión a base de datos
- errores de CORS
- timeouts

## 6. Señales de aprobación final

Puedes considerar el deploy validado si:
- backend responde health OK
- frontend carga bien
- login/logout funcionan
- búsqueda pública funciona
- profile update funciona
- no aparecen 500s en flujos principales
- no hay errores de DB/CORS en logs

## 7. Rollback

Si algo sale mal:
- revertir release de frontend
- restaurar versión anterior de backend
- revisar si hubo migraciones destructivas
- restaurar backup si fuese necesario
