import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useContactos } from '@/context/ContactosContext';

export default function NuevoContactoScreen() {
  const router = useRouter();
  const { agregarContacto } = useContactos();

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [favorito, setFavorito] = useState(false);

  // Estado de envío
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(false);

  // Validaciones
  const esCorreoValido = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const limpiarFormulario = () => {
    setNombre('');
    setApellido('');
    setTelefono('');
    setCorreo('');
    setFavorito(false);
    setMensajeExito(false);
  };

  const handleGuardar = async () => {
    // Validar campos obligatorios
    if (!nombre.trim()) {
      notificarError('El nombre del contacto es obligatorio.');
      return;
    }

    if (!telefono.trim()) {
      notificarError('El número de teléfono es obligatorio.');
      return;
    }

    if (!correo.trim()) {
      notificarError('El correo electrónico es obligatorio.');
      return;
    }

    if (!esCorreoValido(correo)) {
      notificarError('Por favor ingresa un formato de correo electrónico válido (ejemplo: usuario@dominio.com).');
      return;
    }

    setGuardando(true);
    setMensajeExito(false);

    const res = await agregarContacto({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      telefono: telefono.trim(),
      correo: correo.trim().toLowerCase(),
      favorito,
    });

    setGuardando(false);

    if (res.ok) {
      setMensajeExito(true);
      if (Platform.OS === 'web') {
        // En web mostramos un mensaje visual directo
      } else {
        Alert.alert(
          '¡Contacto Guardado!',
          `Se ha guardado a ${nombre} con éxito en tu agenda.`,
          [
            { text: 'Agregar otro', onPress: () => limpiarFormulario() },
            { text: 'Ver contactos', onPress: () => router.push('/') },
          ]
        );
      }
    } else {
      notificarError(res.error || 'No se pudo guardar el contacto.');
    }
  };

  const notificarError = (msg: string) => {
    if (Platform.OS === 'web') {
      alert(msg);
    } else {
      Alert.alert('Atención', msg);
    }
  };

  // Iniciales para la vista previa
  const iniciales = `${nombre ? nombre.trim().charAt(0).toUpperCase() : '?'}${
    apellido ? apellido.trim().charAt(0).toUpperCase() : ''
  }`;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.pantalla}>
      <ScrollView
        contentContainerStyle={styles.scrollContenido}
        keyboardShouldPersistTaps="handled">
        {/* Banner de Éxito */}
        {mensajeExito && (
          <View style={styles.bannerExito}>
            <Ionicons name="checkmark-circle" size={24} color="#059669" />
            <View style={styles.bannerExitoTextos}>
              <Text style={styles.bannerExitoTitulo}>¡Contacto guardado exitosamente!</Text>
              <Text style={styles.bannerExitoSub}>
                El contacto ha sido añadido a tu agenda y sincronizado.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.btnVerAgenda}
              onPress={() => router.push('/')}>
              <Text style={styles.btnVerAgendaTexto}>Ver Lista</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tarjeta de Vista Previa en Vivo */}
        <View style={styles.seccionPreview}>
          <Text style={styles.seccionPreviewTitulo}>VISTA PREVIA EN VIVO</Text>
          <View style={styles.cardPreview}>
            <View style={styles.avatarPreview}>
              <Text style={styles.avatarPreviewTexto}>{iniciales}</Text>
            </View>
            <View style={styles.infoPreview}>
              <View style={styles.filaPreviewHeader}>
                <Text style={styles.nombrePreview} numberOfLines={1}>
                  {nombre.trim() || 'Nombre'} {apellido.trim() || 'Apellido'}
                </Text>
                {favorito && <Ionicons name="star" size={18} color="#F59E0B" />}
              </View>
              <Text style={styles.datoPreview}>
                📞 {telefono.trim() || '+593 99 999 9999'}
              </Text>
              <Text style={styles.datoPreview}>
                ✉️ {correo.trim() || 'contacto@ejemplo.com'}
              </Text>
            </View>
          </View>
        </View>

        {/* Formulario */}
        <View style={styles.formularioCard}>
          <Text style={styles.formularioTitulo}>Datos del Contacto</Text>
          <Text style={styles.formularioSubtitulo}>
            Completa los siguientes campos para registrar el contacto.
          </Text>

          {/* Nombre */}
          <View style={styles.grupoInput}>
            <Text style={styles.label}>
              Nombre <Text style={styles.requerido}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcono} />
              <TextInput
                style={styles.input}
                placeholder="Ej: Pamela"
                placeholderTextColor="#94A3B8"
                value={nombre}
                onChangeText={(val) => {
                  setNombre(val);
                  setMensajeExito(false);
                }}
              />
            </View>
          </View>

          {/* Apellido */}
          <View style={styles.grupoInput}>
            <Text style={styles.label}>Apellido (Opcional)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcono} />
              <TextInput
                style={styles.input}
                placeholder="Ej: Macías"
                placeholderTextColor="#94A3B8"
                value={apellido}
                onChangeText={(val) => {
                  setApellido(val);
                  setMensajeExito(false);
                }}
              />
            </View>
          </View>

          {/* Teléfono */}
          <View style={styles.grupoInput}>
            <Text style={styles.label}>
              Número de Teléfono <Text style={styles.requerido}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#64748B" style={styles.inputIcono} />
              <TextInput
                style={styles.input}
                placeholder="Ej: +593 98 765 4321"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={telefono}
                onChangeText={(val) => {
                  setTelefono(val);
                  setMensajeExito(false);
                }}
              />
            </View>
          </View>

          {/* Correo Electrónico */}
          <View style={styles.grupoInput}>
            <Text style={styles.label}>
              Correo Electrónico <Text style={styles.requerido}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcono} />
              <TextInput
                style={styles.input}
                placeholder="Ej: pamela@ejemplo.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={correo}
                onChangeText={(val) => {
                  setCorreo(val);
                  setMensajeExito(false);
                }}
              />
            </View>
          </View>

          {/* Switch Favorito */}
          <View style={styles.switchFila}>
            <View style={styles.switchTextos}>
              <Text style={styles.switchTitulo}>Marcar como Favorito</Text>
              <Text style={styles.switchDesc}>Aparecerá destacado en la pestaña de Favoritos</Text>
            </View>
            <Switch
              value={favorito}
              onValueChange={setFavorito}
              trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
              thumbColor={favorito ? '#2563EB' : '#94A3B8'}
            />
          </View>

          {/* Botones de acción */}
          <View style={styles.filaBotones}>
            <TouchableOpacity
              style={styles.btnGuardar}
              onPress={handleGuardar}
              disabled={guardando}
              activeOpacity={0.8}>
              {guardando ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.btnGuardarTexto}>Guardar Contacto</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnLimpiar}
              onPress={limpiarFormulario}
              disabled={guardando}>
              <Ionicons name="refresh-outline" size={18} color="#64748B" />
              <Text style={styles.btnLimpiarTexto}>Limpiar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContenido: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  bannerExito: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  bannerExitoTextos: {
    flex: 1,
  },
  bannerExitoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  bannerExitoSub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  btnVerAgenda: {
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  btnVerAgendaTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  seccionPreview: {
    marginBottom: 16,
  },
  seccionPreviewTitulo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 4,
  },
  cardPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarPreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPreviewTexto: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoPreview: {
    flex: 1,
  },
  filaPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  nombrePreview: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  datoPreview: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  formularioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formularioTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  formularioSubtitulo: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  grupoInput: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  requerido: {
    color: '#EF4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcono: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: 14,
    color: '#0F172A',
  },
  switchFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginVertical: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  switchTextos: {
    flex: 1,
    marginRight: 12,
  },
  switchTitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  switchDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  filaBotones: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  btnGuardar: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  btnGuardarTexto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btnLimpiar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    borderRadius: 10,
  },
  btnLimpiarTexto: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
});
