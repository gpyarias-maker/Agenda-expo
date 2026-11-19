import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export interface Contacto {
  id: number | string;
  nombre: string;
  apellido?: string;
  telefono: string;
  correo: string;
  favorito?: boolean;
  created_at?: string;
}

const STORAGE_KEY_CONTACTOS = '@agenda_contactos_cache';
const STORAGE_KEY_FAVORITOS = '@agenda_favoritos_ids';

const CONTACTOS_EJEMPLO: Contacto[] = [
  {
    id: 101,
    nombre: 'Pamela',
    apellido: 'Macías',
    telefono: '+593 98 765 4321',
    correo: 'pamela.macias@example.com',
    favorito: true,
  },
  {
    id: 102,
    nombre: 'Carlos',
    apellido: 'Mendoza',
    telefono: '+593 99 123 4567',
    correo: 'carlos.mendoza@example.com',
    favorito: false,
  },
  {
    id: 103,
    nombre: 'Andrea',
    apellido: 'Salazar',
    telefono: '+593 97 888 9900',
    correo: 'andrea.salazar@example.com',
    favorito: true,
  },
];

export const contactosService = {
  // Obtener IDs de favoritos locales
  async obtenerFavoritosIds(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY_FAVORITOS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Alternar estado favorito
  async toggleFavorito(id: number | string): Promise<boolean> {
    try {
      const favs = await this.obtenerFavoritosIds();
      const strId = String(id);
      let updated: string[];
      let esFav = false;

      if (favs.includes(strId)) {
        updated = favs.filter((f) => f !== strId);
        esFav = false;
      } else {
        updated = [...favs, strId];
        esFav = true;
      }

      await AsyncStorage.setItem(STORAGE_KEY_FAVORITOS, JSON.stringify(updated));
      return esFav;
    } catch {
      return false;
    }
  },

  // 1. READ: Obtener todos los contactos
  async obtenerContactos(): Promise<{ contactos: Contacto[]; fuente: 'nube' | 'local'; error?: string }> {
    const favs = await this.obtenerFavoritosIds();

    try {
      // Intentar primero desde Supabase
      const { data, error } = await supabase
        .from('contactos')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        throw error;
      }

      const lista = (data || []).map((c: any) => ({
        ...c,
        favorito: favs.includes(String(c.id)),
      }));

      // Guardar en caché local
      await AsyncStorage.setItem(STORAGE_KEY_CONTACTOS, JSON.stringify(lista));

      return { contactos: lista, fuente: 'nube' };
    } catch (err: any) {
      console.warn('Fallo conexión a Supabase, recurriendo a almacenamiento local:', err.message);

      // Cargar desde almacenamiento local
      try {
        const localData = await AsyncStorage.getItem(STORAGE_KEY_CONTACTOS);
        if (localData) {
          const parsed = JSON.parse(localData).map((c: Contacto) => ({
            ...c,
            favorito: favs.includes(String(c.id)),
          }));
          return { contactos: parsed, fuente: 'local', error: err.message };
        }
      } catch {}

      // Si no hay datos locales aún, cargar ejemplos iniciales
      await AsyncStorage.setItem(STORAGE_KEY_CONTACTOS, JSON.stringify(CONTACTOS_EJEMPLO));
      return { contactos: CONTACTOS_EJEMPLO, fuente: 'local', error: err.message };
    }
  },

  // 2. CREATE: Agregar nuevo contacto
  async crearContacto(
    contacto: Omit<Contacto, 'id'>
  ): Promise<{ ok: boolean; contacto?: Contacto; error?: string }> {
    const datosParaGuardar = {
      nombre: contacto.nombre.trim(),
      apellido: (contacto.apellido || '').trim(),
      telefono: contacto.telefono.trim(),
      correo: contacto.correo.trim().toLowerCase(),
    };

    try {
      // Insertar en Supabase
      const { data, error } = await supabase
        .from('contactos')
        .insert([datosParaGuardar])
        .select();

      if (error) {
        throw error;
      }

      const nuevo = data && data[0] ? data[0] : { id: Date.now(), ...datosParaGuardar };

      // Si el usuario lo marcó como favorito al crear
      if (contacto.favorito) {
        await this.toggleFavorito(nuevo.id);
        nuevo.favorito = true;
      }

      // Actualizar caché local
      const { contactos } = await this.obtenerContactos();
      return { ok: true, contacto: nuevo };
    } catch (err: any) {
      console.warn('Error al guardar en Supabase, guardando en local:', err.message);

      // Guardar localmente
      const idLocal = Date.now();
      const nuevoLocal: Contacto = {
        id: idLocal,
        ...datosParaGuardar,
        favorito: !!contacto.favorito,
      };

      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY_CONTACTOS);
        const lista: Contacto[] = raw ? JSON.parse(raw) : [];
        lista.unshift(nuevoLocal);
        await AsyncStorage.setItem(STORAGE_KEY_CONTACTOS, JSON.stringify(lista));

        if (contacto.favorito) {
          await this.toggleFavorito(idLocal);
        }

        return { ok: true, contacto: nuevoLocal };
      } catch (localErr: any) {
        return { ok: false, error: localErr.message };
      }
    }
  },

  // 3. UPDATE: Actualizar contacto existente
  async actualizarContacto(
    id: number | string,
    datos: Partial<Contacto>
  ): Promise<{ ok: boolean; error?: string }> {
    const payload: any = {};
    if (datos.nombre !== undefined) payload.nombre = datos.nombre.trim();
    if (datos.apellido !== undefined) payload.apellido = datos.apellido.trim();
    if (datos.telefono !== undefined) payload.telefono = datos.telefono.trim();
    if (datos.correo !== undefined) payload.correo = datos.correo.trim().toLowerCase();

    try {
      // Si el id es numérico legítimo, actualizar en Supabase
      if (typeof id === 'number' || !isNaN(Number(id))) {
        const { error } = await supabase
          .from('contactos')
          .update(payload)
          .eq('id', id);

        if (error) {
          throw error;
        }
      }
    } catch (err: any) {
      console.warn('Error al actualizar en Supabase:', err.message);
    }

    // Actualizar siempre también el almacenamiento local
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_CONTACTOS);
      if (raw) {
        const lista: Contacto[] = JSON.parse(raw);
        const index = lista.findIndex((c) => String(c.id) === String(id));
        if (index !== -1) {
          lista[index] = { ...lista[index], ...payload };
          await AsyncStorage.setItem(STORAGE_KEY_CONTACTOS, JSON.stringify(lista));
        }
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  },

  // 4. DELETE: Eliminar contacto
  async eliminarContacto(id: number | string): Promise<{ ok: boolean; error?: string }> {
    try {
      if (typeof id === 'number' || !isNaN(Number(id))) {
        const { error } = await supabase
          .from('contactos')
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }
      }
    } catch (err: any) {
      console.warn('Error al eliminar en Supabase:', err.message);
    }

    // Eliminar también del almacenamiento local
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_CONTACTOS);
      if (raw) {
        const lista: Contacto[] = JSON.parse(raw);
        const filtrada = lista.filter((c) => String(c.id) !== String(id));
        await AsyncStorage.setItem(STORAGE_KEY_CONTACTOS, JSON.stringify(filtrada));
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  },

  // Probar estado de conexión con Supabase
  async probarConexion(): Promise<{ ok: boolean; mensaje: string }> {
    try {
      const { data, error } = await supabase.from('contactos').select('id').limit(1);
      if (error) {
        return { ok: false, mensaje: error.message };
      }
      return { ok: true, mensaje: 'Conexión a Supabase exitosa y tabla "contactos" activa.' };
    } catch (err: any) {
      return { ok: false, mensaje: err.message || 'Sin conexión a internet o Supabase no disponible.' };
    }
  },

  // Cargar contactos de ejemplo en caso de agenda vacía
  async cargarEjemplos(): Promise<void> {
    for (const contacto of CONTACTOS_EJEMPLO) {
      await this.crearContacto({
        nombre: contacto.nombre,
        apellido: contacto.apellido,
        telefono: contacto.telefono,
        correo: contacto.correo,
        favorito: contacto.favorito,
      });
    }
  },
};
