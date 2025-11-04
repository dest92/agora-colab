# 🔌 API Client - Agora Frontend

Cliente HTTP y WebSocket para comunicarse con el backend de microservicios de Agora.

## 📦 Estructura

```
app/_lib/api/
├── types.ts         # TypeScript types (Card, Tag, etc.)
├── client.ts        # HTTP client con JWT auth
├── boards.ts        # Cards API (Boards Service)
├── tags.ts          # Tags API (Collab Service)
├── assignees.ts     # Assignees API (Collab Service)
├── workspaces.ts    # Workspaces API
├── sessions.ts      # Sessions API
├── socket.ts        # Socket.IO client para real-time
└── index.ts         # Exports centralizados
```

## 🚀 Uso Rápido

### 1. Configurar Variables de Entorno

```bash
cp .env.example .env.local
```

Editar `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

### 2. Importar APIs

```typescript
import {
  boardsApi,
  tagsApi,
  assigneesApi,
  workspacesApi,
  sessionsApi,
  socketClient,
  apiClient,
} from "@/app/_lib/api";
```

## 📋 Cards (Boards Service)

### Crear Card

```typescript
const card = await boardsApi.createCard("board-uuid", {
  content: "Nueva tarea",
  priority: "high",
  laneId: "todo",
  position: 0,
});
```

### Listar Cards

```typescript
// Todas las cards del board
const cards = await boardsApi.listCards("board-uuid");

// Cards de un lane específico
const todoCards = await boardsApi.listCards("board-uuid", {
  laneId: "todo",
});
```

### Actualizar Card

```typescript
const updatedCard = await boardsApi.updateCard("board-uuid", "card-uuid", {
  content: "Contenido actualizado",
  laneId: "in-progress",
  priority: "medium",
});
```

### Archivar/Desarchivar

```typescript
await boardsApi.archiveCard("board-uuid", "card-uuid");
await boardsApi.unarchiveCard("board-uuid", "card-uuid");
```

## 🏷️ Tags (Collab Service)

### Crear Tag

```typescript
const tag = await tagsApi.createTag("board-uuid", {
  label: "Bug",
  color: "#ff0000",
});
```

### Listar Tags

```typescript
const tags = await tagsApi.listTags("board-uuid");
```

### Asignar/Desasignar Tag

```typescript
await tagsApi.assignTag("board-uuid", "card-uuid", "tag-uuid");
await tagsApi.unassignTag("board-uuid", "card-uuid", "tag-uuid");
```

## 👥 Assignees (Collab Service)

```typescript
await assigneesApi.addAssignee("board-uuid", "card-uuid", "user-uuid");
await assigneesApi.removeAssignee("board-uuid", "card-uuid", "user-uuid");
```

## 🏢 Workspaces

```typescript
// Crear workspace
const workspace = await workspacesApi.createWorkspace({
  name: "Mi Equipo",
  description: "Workspace para el equipo",
});

// Listar workspaces
const workspaces = await workspacesApi.listWorkspaces();
```

## 🔐 Autenticación

### Configurar JWT Token

```typescript
import { apiClient } from "@/app/_lib/api";

// Después del login con Supabase
const {
  data: { session },
} = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "password",
});

// Configurar token en el client
apiClient.setToken(session.access_token);
```

### Limpiar Token (Logout)

```typescript
apiClient.setToken(null);
```

## 🔄 WebSocket (Real-time)

### Conectar

```typescript
import { socketClient } from "@/app/_lib/api";

// Conectar y auto-join a room del board
socketClient.connect({
  boardId: "board-uuid",
});
```

### Escuchar Eventos

```typescript
// Cards
socketClient.on("card:created", (payload) => {
  console.log("Nueva card:", payload);
  // Actualizar UI
});

socketClient.on("card:updated", (payload) => {
  console.log("Card actualizada:", payload);
  // Actualizar UI
});

socketClient.on("card:archived", (payload) => {
  console.log("Card archivada:", payload);
  // Actualizar UI
});

// Tags
socketClient.on("tag:created", (payload) => {
  console.log("Nuevo tag:", payload);
});

socketClient.on("tag:assigned", (payload) => {
  console.log("Tag asignado:", payload);
});

// Assignees
socketClient.on("assignee:added", (payload) => {
  console.log("Assignee agregado:", payload);
});
```

### Desconectar

```typescript
socketClient.disconnect();
```

## 🎣 React Hooks (Ejemplo de uso)

### Hook para Board con Real-time

```typescript
import { useState, useEffect } from "react";
import { boardsApi, socketClient } from "@/app/_lib/api";
import type { Card } from "@/app/_lib/api";

function useBoardCards(boardId: string) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar cards iniciales
    async function loadCards() {
      try {
        const data = await boardsApi.listCards(boardId);
        setCards(data);
      } catch (error) {
        console.error("Error loading cards:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCards();

    // Conectar WebSocket
    socketClient.connect({ boardId });

    // Escuchar eventos
    const handleCardCreated = (payload: any) => {
      setCards((prev) => [...prev, payload]);
    };

    const handleCardUpdated = (payload: any) => {
      setCards((prev) =>
        prev.map((card) =>
          card.id === payload.cardId ? { ...card, ...payload } : card
        )
      );
    };

    const handleCardArchived = (payload: any) => {
      setCards((prev) => prev.filter((card) => card.id !== payload.cardId));
    };

    socketClient.on("card:created", handleCardCreated);
    socketClient.on("card:updated", handleCardUpdated);
    socketClient.on("card:archived", handleCardArchived);

    // Cleanup
    return () => {
      socketClient.off("card:created", handleCardCreated);
      socketClient.off("card:updated", handleCardUpdated);
      socketClient.off("card:archived", handleCardArchived);
    };
  }, [boardId]);

  return { cards, loading };
}
```

## ⚠️ Manejo de Errores

Todos los métodos pueden lanzar errores. Usar try/catch:

```typescript
try {
  const card = await boardsApi.createCard("board-uuid", dto);
} catch (error) {
  console.error("Error creando card:", error);
  // Mostrar toast de error
}
```

## 🏗️ Arquitectura Backend

El cliente se comunica con el **API Gateway** (puerto 3000) que internamente se comunica con los microservicios:

```
Frontend (Next.js)
    ↓ HTTP/WebSocket
API Gateway (:3000)
    ↓ TCP
┌─────────────┬──────────────┬────────────┐
│   Boards    │    Collab    │  Sessions  │
│  Service    │   Service    │  Service   │
│   (:3011)   │   (:3012)    │  (:3013)   │
└─────────────┴──────────────┴────────────┘
```

## 📝 TypeScript Types

Todos los tipos están en `types.ts`:

```typescript
import type {
  Card,
  Tag,
  CreateCardDto,
  UpdateCardDto,
  WebSocketEvent,
} from "@/app/_lib/api";
```

## 🔜 Próximos Pasos

1. **Integrar en Board Component** - Reemplazar localStorage con APIs
2. **Agregar Supabase Auth** - JWT tokens automáticos
3. **Error Handling** - Toasts y UI feedback
4. **Optimistic Updates** - UI instantánea con rollback
5. **Offline Support** - Service Worker + IndexedDB

---

**¡La capa de API está lista para usar!** 🎉
