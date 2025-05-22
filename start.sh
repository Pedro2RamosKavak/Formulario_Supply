#!/bin/bash

# Colores para mensajes en consola
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}== SISTEMA DE INSPECCIÓN DE VEHÍCULOS ==${NC}"
echo -e "${BLUE}========================================${NC}"

# Verificar si los puertos requeridos están disponibles
check_port() {
  local port=$1
  if lsof -i :$port > /dev/null 2>&1; then
    echo -e "${RED}Puerto $port está ocupado. Este puerto es necesario para el sistema.${NC}"
    echo -e "${YELLOW}Por favor, detenga cualquier servicio que esté usando el puerto $port y vuelva a intentarlo.${NC}"
    return 1
  else
    echo -e "${GREEN}Puerto $port disponible ✓${NC}"
    return 0
  fi
}

echo -e "\n${BLUE}Verificando disponibilidad de puertos...${NC}"
check_port 3000 || exit 1  # Form App
check_port 3001 || exit 1  # Review App
check_port 3003 || exit 1  # Backend

echo -e "\n${GREEN}Todos los puertos requeridos están disponibles.${NC}"

# Ubicaciones de las aplicaciones
BACKEND_DIR="apps/backend"
FORM_APP_DIR="apps/form-app"
REVIEW_APP_DIR="apps/review-app"

# Verificar que los directorios existan
if [ ! -d "$BACKEND_DIR" ]; then
  echo -e "${RED}Error: No se encontró el directorio del backend ($BACKEND_DIR)${NC}"
  exit 1
fi

if [ ! -d "$FORM_APP_DIR" ]; then
  echo -e "${RED}Error: No se encontró el directorio de la Form App ($FORM_APP_DIR)${NC}"
  exit 1
fi

if [ ! -d "$REVIEW_APP_DIR" ]; then
  echo -e "${RED}Error: No se encontró el directorio de la Review App ($REVIEW_APP_DIR)${NC}"
  exit 1
fi

# Asegurar que los paquetes estén instalados
echo -e "\n${BLUE}Verificando instalación de paquetes...${NC}"

check_node_modules() {
  local dir=$1
  if [ ! -d "$dir/node_modules" ]; then
    echo -e "${YELLOW}Instalando dependencias en $dir...${NC}"
    (cd $dir && npm install) || exit 1
  else
    echo -e "${GREEN}Dependencias ya instaladas en $dir ✓${NC}"
  fi
}

check_node_modules $BACKEND_DIR
check_node_modules $FORM_APP_DIR
check_node_modules $REVIEW_APP_DIR

# Iniciar las aplicaciones en terminales separadas
echo -e "\n${BLUE}Iniciando el sistema...${NC}"

# Función para iniciar aplicación en una nueva terminal
start_app() {
  local dir=$1
  local command=$2
  local title=$3
  
  # Para macOS
  if [[ "$OSTYPE" == "darwin"* ]]; then
    osascript -e "tell app \"Terminal\" to do script \"cd $(pwd)/$dir && $command\""
  # Para Linux con gnome-terminal
  elif command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "cd $(pwd)/$dir && $command; exec bash"
  # Para otros sistemas
  else
    echo -e "${YELLOW}No se pudo abrir una nueva terminal. Iniciando en segundo plano...${NC}"
    (cd $dir && $command &)
  fi
  
  echo -e "${GREEN}$title iniciado ✓${NC}"
}

# Iniciar backend primero
echo -e "${BLUE}Iniciando Backend...${NC}"
start_app $BACKEND_DIR "npm run dev" "Backend (Puerto 3003)"

# Esperar un momento para que el backend se inicie
sleep 2

# Iniciar form-app
echo -e "${BLUE}Iniciando Form App...${NC}"
start_app $FORM_APP_DIR "npm run dev" "Form App (Puerto 3000)"

# Iniciar review-app
echo -e "${BLUE}Iniciando Review App...${NC}"
start_app $REVIEW_APP_DIR "npm run dev" "Review App (Puerto 3001)"

echo -e "\n${GREEN}¡Sistema iniciado correctamente!${NC}"
echo -e "${BLUE}Acceso a las aplicaciones:${NC}"
echo -e "- Form App: ${GREEN}http://localhost:3000${NC}"
echo -e "- Review App: ${GREEN}http://localhost:3001${NC}"
echo -e "- Backend API: ${GREEN}http://localhost:3003/api${NC}\n"
echo -e "${YELLOW}Nota: Para detener el sistema, cierre las terminales o use Ctrl+C en cada una.${NC}" 