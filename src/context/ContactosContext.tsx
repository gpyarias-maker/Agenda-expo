import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Contacto, contactosService } from '@/services/contactosService';

interface ContactosContextType {
  contactos: Contacto[];
  cargando: boolean;
  refrescando: boolean;
  fuenteConexion: 'nube' | 'local';
  mensajeError: string | null;
  cargarContactos: () => Promise<void>;
  refrescar: () => Promise<void>;
  agregarContacto: (contacto: Omit<Contacto, 'id'>) => Promise<{ ok: boolean; error?: string }>;
  actualizarContacto: (
    id: number | string,
    datos: Partial<Contacto>
  ) => Promise<{ ok: boolean; error?: string }>;
  eliminarContacto: (id: number | string) => Promise<{ ok: boolean; error?: string }>;
  toggleFavorito: (id: number | string) => Promise<void>;
  cargarEjemplos: () => Promise<void>;
}

const ContactosContext = createContext<ContactosContextType | undefined>(undefined);

export const ContactosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [refrescando, setRefrescando] = useState<boolean>(false);
  const [fuenteConexion, setFuenteConexion] = useState<'nube' | 'local'>('nube');
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const cargarContactos = useCallback(async () => {
    const res = await contactosService.obtenerContactos();
    setContactos(res.contactos);
    setFuenteConexion(res.fuente);
    if (res.error) {
      setMensajeError(res.error);
    } else {
      setMensajeError(null);
    }
    setCargando(false);
  }, []);

  const refrescar = useCallback(async () => {
    setRefrescando(true);
    await cargarContactos();
    setRefrescando(false);
  }, [cargarContactos]);

  useEffect(() => {
    cargarContactos();
  }, [cargarContactos]);

  const agregarContacto = async (contacto: Omit<Contacto, 'id'>) => {
    const res = await contactosService.crearContacto(contacto);
    if (res.ok) {
      await cargarContactos();
    }
    return res;
  };

  const actualizarContacto = async (id: number | string, datos: Partial<Contacto>) => {
    const res = await contactosService.actualizarContacto(id, datos);
    if (res.ok) {
      await cargarContactos();
    }
    return res;
  };

  const eliminarContacto = async (id: number | string) => {
    const res = await contactosService.eliminarContacto(id);
    if (res.ok) {
      await cargarContactos();
    }
    return res;
  };

  const toggleFavorito = async (id: number | string) => {
    const nuevoEstado = await contactosService.toggleFavorito(id);
    setContactos((prev) =>
      prev.map((c) => (String(c.id) === String(id) ? { ...c, favorito: nuevoEstado } : c))
    );
  };

  const cargarEjemplos = async () => {
    setCargando(true);
    await contactosService.cargarEjemplos();
    await cargarContactos();
  };

  return (
    <ContactosContext.Provider
      value={{
        contactos,
        cargando,
        refrescando,
        fuenteConexion,
        mensajeError,
        cargarContactos,
        refrescar,
        agregarContacto,
        actualizarContacto,
        eliminarContacto,
        toggleFavorito,
        cargarEjemplos,
      }}>
      {children}
    </ContactosContext.Provider>
  );
};

export const useContactos = () => {
  const context = useContext(ContactosContext);
  if (!context) {
    throw new Error('useContactos debe utilizarse dentro de un ContactosProvider');
  }
  return context;
};
