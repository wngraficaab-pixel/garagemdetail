import ReloadPrompt from './src/ReloadPrompt';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AppView, Service, BookingState, Appointment, ChatMessage, ServiceExtra, Quote, VehicleCategory } from './types';
import { SERVICES } from './constants';
import { supabase } from './src/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { format, addDays, startOfDay, addMinutes, differenceInMinutes, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDateToBRL } from './src/utils';



const CustomerLoginScreen: React.FC<{ onLogin: (phone: string) => void; onBack: () => void }> = ({ onLogin, onBack }) => {
  const [phone, setPhone] = useState('');

  const formatPhone = (v: string) => {
    const numbers = v.replace(/\D/g, '').slice(0, 11);

    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 3) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col p-6 max-w-md mx-auto w-full transition-colors justify-center">
      <button onClick={onBack} className="absolute top-6 left-6 size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
      <div className="text-center mb-8">
        <div className="size-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4"><span className="material-symbols-outlined text-4xl">smartphone</span></div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Identifique-se</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Informe seu celular para ver seus agendamentos.</p>
      </div>
      <div className="space-y-4">
        <input
          value={phone}
          onChange={handlePhoneChange}
          className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white placeholder:text-gray-400 text-center text-lg tracking-widest font-mono"
          placeholder="(00) 0 0000-0000"
          type="tel"
        />
        <button
          onClick={() => {
            const raw = phone.replace(/\D/g, '');
            if (raw.length > 8) onLogin(raw);
            else alert('Telefone inválido');
          }}
          className="w-full bg-primary py-4 rounded-xl font-bold shadow-lg shadow-primary/20 text-white"
        >
          Ver Agendamentos
        </button>
      </div>
    </div>
  );
};

const AdminClientsScreen: React.FC<{ onBack: () => void; onChat: (id: string, name: string) => void }> = ({ onBack, onChat }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [editingClient, setEditingClient] = useState<any | null>(null);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error) console.error('Error fetching clients:', error);
    else if (data) setClients(data);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente ${name}? Isso apagará também o histórico de agendamentos e conversas.`)) {
      // Delete interactions first to avoid FK constraints
      await supabase.from('chat_messages').delete().eq('client_id', id);
      await supabase.from('appointments').delete().eq('client_id', id);

      // Now delete client
      const { error } = await supabase.from('clients').delete().eq('id', id);

      if (error) alert('Erro ao excluir: ' + error.message);
      else fetchClients();
    }
  };

  const handleUpdate = () => {
    if (!editingClient) return;
    supabase.from('clients').update({
      name: editingClient.name,
      phone: editingClient.phone
    })
      .eq('id', editingClient.id)
      .then(({ error }) => {
        if (error) alert('Erro ao atualizar: ' + error.message);
        else {
          setEditingClient(null);
          fetchClients();
        }
      });
  };

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors relative">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 flex items-center justify-between backdrop-blur-md transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-slate-900 dark:text-white">Clientes Cadastrados</h2>
        <div className="bg-gray-100 dark:bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300">
          {clients.length}
        </div>
      </header>
      <div className="p-4 bg-white dark:bg-background-dark border-b border-gray-200 dark:border-white/5 sticky top-[73px] z-40">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full bg-gray-100 dark:bg-surface-dark p-3 rounded-lg border-transparent text-sm text-slate-900 dark:text-white"
        />
      </div>
      <main className="p-4 space-y-2 flex-1 pb-24">
        {filtered.map(c => (
          <div key={c.id} className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-white/5 flex flex-col gap-4 transition-colors">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 font-bold uppercase">
                {c.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900 dark:text-white text-sm">{c.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{c.phone}</p>
              </div>
              <div className="text-xs text-gray-400">
                #{c.id}
              </div>
            </div>
            <div className="flex gap-2 border-t border-gray-100 dark:border-white/5 pt-3">
              <button onClick={() => onChat(String(c.id), c.name)} className="flex-1 py-2 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-500/20">
                <span className="material-symbols-outlined text-sm">chat</span> Chat
              </button>
              <button onClick={() => setEditingClient(c)} className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-slate-700 dark:text-gray-300 text-xs font-bold flex items-center justify-center gap-1 hover:bg-gray-200 dark:hover:bg-white/10">
                <span className="material-symbols-outlined text-sm">edit</span> Editar
              </button>
              <button onClick={() => handleDelete(c.id, c.name)} className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold flex items-center justify-center gap-1 hover:bg-red-500/20">
                <span className="material-symbols-outlined text-sm">delete</span> Excluir
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* Edit Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-2xl p-6 shadow-xl animate-enter">
            <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Editar Cliente</h3>
            <div className="space-y-4">
              <input
                value={editingClient.name}
                onChange={e => setEditingClient({ ...editingClient, name: e.target.value })}
                className="w-full bg-gray-100 dark:bg-background-dark p-3 rounded-lg text-slate-900 dark:text-white"
                placeholder="Nome"
              />
              <input
                value={editingClient.phone}
                onChange={e => setEditingClient({ ...editingClient, phone: e.target.value })}
                className="w-full bg-gray-100 dark:bg-background-dark p-3 rounded-lg text-slate-900 dark:text-white"
                placeholder="Telefone"
              />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingClient(null)} className="flex-1 py-3 text-gray-500 font-bold">Cancelar</button>
                <button onClick={handleUpdate} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// --- Utilities ---

const getNextDays = (count: number) => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      dayNum: d.getDate(),
      label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      isToday: i === 0,
      isDisabled: d.getDay() === 0, // Disable Sundays
      monthName: d.toLocaleDateString('pt-BR', { month: 'long' }),
      year: d.getFullYear()
    });
  }
  return days;
};

const formatDuration = (totalMins: number) => {
  if (!totalMins) return '0 min';
  const days = Math.floor(totalMins / (24 * 60));
  const hours = Math.floor((totalMins % (24 * 60)) / 60);
  const mins = totalMins % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  return parts.join(' ') || '0 min';
};

const parseDuration = (days: number, hours: number, mins: number) => {
  return (days * 24 * 60) + (hours * 60) + mins;
};



const SuccessOverlay: React.FC = () => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/90 backdrop-blur-md animate-fade-in px-6">
    <div className="bg-white dark:bg-surface-dark p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center animate-scale-up border border-gray-100 dark:border-white/10 max-w-sm w-full">
      <div className="size-24 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mb-6 animate-bounce-custom">
        <span className="material-symbols-outlined text-6xl text-green-600 dark:text-green-400">check_circle</span>
      </div>
      <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-2">Agendamento feito com sucesso!</h2>
      <p className="text-gray-500 dark:text-gray-400 font-medium">Seu horário está reservado.</p>
    </div>
  </div>
);

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const IOSNotification: React.FC<{ message: string; visible: boolean; onClose: () => void }> = ({ message, visible, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300); // Wait for fade out
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, onClose]);

  if (!visible && !show) return null;

  return (
    <div className={`fixed top-4 left-4 right-4 z-[100] transition-all duration-500 ease-out transform ${show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
      <div className="bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 p-4 flex items-center gap-4 max-w-sm mx-auto">
        <div className="size-10 rounded-xl bg-green-500 flex items-center justify-center text-white shrink-0">
          <span className="material-symbols-outlined">chat</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Nova Mensagem</h4>
          <p className="text-xs text-gray-500 dark:text-gray-300 truncate">{message}</p>
        </div>
        <button onClick={() => setShow(false)} className="size-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-gray-500">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  );
};

// --- Screens Components ---

const LandingScreen: React.FC<{ onStart: () => void; onAdmin: () => void }> = ({ onStart, onAdmin }) => (
  <div className="relative flex min-h-screen w-full flex-col bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark overflow-hidden transition-colors">
    <div className="relative w-full h-[55vh] min-h-[400px] overflow-hidden rounded-b-[2.5rem]">
      <div className="absolute inset-0 bg-center bg-cover bg-no-repeat" style={{ backgroundImage: 'url("/landing-bg.jpg")' }}></div>
      <div className="absolute inset-0 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light/60 dark:via-background-dark/60 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full p-8 pb-12 flex flex-col items-center justify-end h-full z-10">
        <div className="mb-6 h-32 w-32 flex items-center justify-center">
          <img src="/logo.png" alt="Logo Garagem Detail" className="h-full w-full object-contain" />
        </div>
        <h1 className="text-slate-900 dark:text-white tracking-tight text-4xl font-extrabold leading-tight text-center mb-3">
          {localStorage.getItem('company_name') || "Garagem Detail"}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-base text-center max-w-xs opacity-90 whitespace-pre-line">
          {localStorage.getItem('company_tagline') || "Seu estilo, no seu tempo.\nAgende seu corte em segundos."}
        </p>
      </div>
    </div>
    <div className="flex-1 flex flex-col justify-start px-6 pt-8 pb-8 gap-4 w-full max-w-md mx-auto">
      <button onClick={onStart} className="group relative flex w-full items-center justify-center rounded-xl h-14 bg-primary hover:bg-primary-dark transition-all shadow-lg shadow-primary/25">
        <span className="text-white text-lg font-bold">Agendar</span>
      </button>
      <button onClick={onAdmin} className="flex w-full items-center justify-center gap-2 rounded-lg h-12 text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
        <span className="material-symbols-outlined text-[20px]">storefront</span>
        <span className="text-sm font-semibold">Painel Administrativo</span>
      </button>
    </div>
  </div>
);

const HomeScreen: React.FC<{
  onAgendar: () => void;
  onQuote: () => void;
  onChat: () => void;
  onPerfil: () => void;
  onMais: () => void;
  address: string;
  hours: string[];
}> = ({ onAgendar, onQuote, onChat, onPerfil, onMais, address, hours }) => (
  <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark transition-colors">
    <header className="sticky top-0 z-50 flex items-center justify-center bg-white/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-3 border-b border-gray-200 dark:border-white/5 gap-2 transition-colors">
      <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
      <h2 className="text-lg font-bold leading-tight tracking-tight text-center text-slate-900 dark:text-white">
        {localStorage.getItem('company_name') || "Garagem Detail"}
      </h2>
    </header>
    <main className="flex-1 flex flex-col px-4 pt-4">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Vamos agendar o seu<br />corte?</h1>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={onAgendar} className="relative group flex flex-col items-start justify-end p-4 h-40 w-full rounded-2xl overflow-hidden shadow-lg hover:shadow-xl active:scale-[0.98] transition-all">
          <div className="absolute inset-0 z-0">
            <img alt="Agendamento" className="h-full w-full object-cover" src={`/agendamento_btn.jpg?v=${Date.now()}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          </div>
          <div className="relative z-10 flex flex-col items-start gap-1">
            <div className="mb-1 rounded-full bg-primary p-2 text-white">
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
            </div>
            <span className="text-left text-sm font-bold leading-tight text-white">Fazer o meu agendamento</span>
          </div>
        </button>
        <button onClick={onChat} className="relative group flex flex-col items-start justify-end p-4 h-40 w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-white/5 active:scale-[0.98] transition-all">
          <div className="absolute inset-0 z-0">
            <img alt="Gerente" className="h-full w-full object-cover" src={localStorage.getItem('profile_image') || "/renan.png"} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          </div>
          <div className="relative z-10 flex flex-col items-start gap-1">
            <div className="mb-1 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm">
              <span className="material-symbols-outlined text-[20px]">chat</span>
            </div>
            <span className="text-left text-sm font-bold leading-tight text-white">Falar com o Gerente</span>
          </div>
        </button>
      </div>
      <button onClick={onQuote} className="w-full flex items-center justify-between p-4 bg-orange-500 rounded-2xl shadow-lg border border-white/10 active:scale-[0.98] transition-all mb-6">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-white/20 flex items-center justify-center text-white">
            <span className="material-symbols-outlined">description</span>
          </div>
          <span className="text-white font-bold">Fazer orçamento personalizado</span>
        </div>
        <span className="material-symbols-outlined text-white">chevron_right</span>
      </button>
      <div className="flex flex-col flex-1 items-start gap-4 text-slate-800 dark:text-white px-2">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
            <span className="material-symbols-outlined">schedule</span>
          </div>
          <div>
            <h3 className="font-bold text-lg">Horários de Funcionamento</h3>
            {hours.length > 0 ? (
              hours.map((h, i) => <p key={i} className="text-sm text-gray-500 dark:text-gray-400">{h}</p>)
            ) : (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400">Seg - Sex: 09:00 - 20:00</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sáb: 09:00 - 18:00</p>
              </>
            )}
          </div>
        </div>
        <div className="flex items-start gap-3 mt-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
            <span className="material-symbols-outlined">location_on</span>
          </div>
          <div>
            <h3 className="font-bold text-lg">Endereço</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-line">
              {address || "Rua Osman Loureiro, 33\nCentro, Água Branca - AL"}
            </p>
          </div>
        </div>
      </div>
    </main>
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-white/10 bg-white/95 dark:bg-background-dark/95 backdrop-blur-lg pt-2 transition-colors">
      <div className="flex items-center justify-around px-2 pb-6">
        <button onClick={onAgendar} className="flex flex-1 flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined text-[24px] filled">calendar_month</span>
          <span className="text-[10px] font-medium uppercase">Agendar</span>
        </button>
        <button onClick={onPerfil} className="flex flex-1 flex-col items-center gap-1 text-gray-500 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[24px]">calendar_month</span>
          <span className="text-[10px] font-medium uppercase">Meus Agendamentos</span>
        </button>
        <button onClick={onMais} className="flex flex-1 flex-col items-center gap-1 text-gray-500 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[24px]">logout</span>
          <span className="text-[10px] font-medium uppercase">Sair</span>
        </button>
      </div>
    </nav>
  </div>
);

const CustomQuoteScreen: React.FC<{ onBack: () => void; setBooking: React.Dispatch<React.SetStateAction<BookingState>>; customerPhone: string; customerName: string }> = ({ onBack, setBooking, customerPhone, customerName }) => {
  const [step, setStep] = useState<'IDENTIFY' | 'VEHICLE' | 'SERVICES' | 'SUCCESS'>(customerPhone ? 'VEHICLE' : 'IDENTIFY');
  const [loading, setLoading] = useState(false);
  const [tempIdentify, setTempIdentify] = useState({ name: customerName, phone: customerPhone });
  const [quoteData, setQuoteData] = useState({
    vehicleColor: '',
    vehicleModelYear: '',
    vehiclePhotos: [] as string[],
    polishingType: '' as 'COMERCIAL' | 'TECNICO' | 'MAQUIAGEM' | 'LOCALIZADO' | '',
    upholsteryOptions: [] as string[],
    upholsteryPhotos: [] as string[],
    localizedPhotos: [] as string[]
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'vehiclePhotos' | 'upholsteryPhotos' | 'localizedPhotos') => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQuoteData(prev => ({
          ...prev,
          [field]: [...prev[field], reader.result as string]
        }));
      };
      reader.readAsDataURL(file as Blob);
    });
  };

  const removePhoto = (index: number, field: 'vehiclePhotos' | 'upholsteryPhotos' | 'localizedPhotos') => {
    setQuoteData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Find or create client
      let clientId: number | undefined;
      const { data: clientData } = await supabase.from('clients').select('id').eq('phone', customerPhone).single();
      if (clientData) {
        clientId = clientData.id;
      } else {
        const { data: newClient, error: clientError } = await supabase.from('clients').insert({ name: customerName || 'Cliente Orçamento', phone: customerPhone }).select().single();
        if (clientError || !newClient) throw new Error('Erro ao salvar cliente');
        clientId = newClient.id;
      }

      const { error } = await supabase.from('quotes').insert({
        client_id: clientId,
        vehicle_color: quoteData.vehicleColor,
        vehicle_model_year: quoteData.vehicleModelYear,
        vehicle_photos: quoteData.vehiclePhotos,
        polishing_type: quoteData.polishingType,
        upholstery_options: quoteData.upholsteryOptions,
        upholstery_photos: quoteData.upholsteryPhotos,
        localized_polishing_photos: quoteData.localizedPhotos,
        status: 'PENDING'
      });

      if (error) throw error;
      setStep('SUCCESS');
    } catch (err: any) {
      alert('Erro ao enviar orçamento: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'SUCCESS') {
    return (
      <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col p-6 items-center justify-center text-center">
        <div className="size-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-600">
          <span className="material-symbols-outlined text-4xl">check_circle</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Solicitação Enviada!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs">Seu orçamento foi recebido. Entraremos em contato em breve para confirmar os detalhes.</p>
        <button onClick={onBack} className="w-full bg-primary text-white py-4 rounded-xl font-bold">Voltar para Início</button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors relative">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 flex items-center justify-between backdrop-blur-md transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-slate-900 dark:text-white">Orçamento Personalizado</h2>
        <div className="size-10"></div>
      </header>

      <main className="flex-1 p-6 space-y-8 max-w-md mx-auto w-full pb-24">
        {step === 'IDENTIFY' && (
          <div className="space-y-6 animate-enter">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">Identificação</h3>
              <p className="text-sm text-gray-500 text-center mb-6">Como podemos te chamar e qual seu WhatsApp?</p>
            </div>
            <div className="space-y-4">
              <input
                placeholder="Seu Nome Completo"
                className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white"
                value={tempIdentify.name}
                onChange={e => setTempIdentify({ ...tempIdentify, name: e.target.value })}
              />
              <input
                placeholder="Seu WhatsApp"
                className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white"
                value={tempIdentify.phone}
                onChange={e => setTempIdentify({ ...tempIdentify, phone: e.target.value })}
              />
            </div>
            <button
              disabled={!tempIdentify.name || tempIdentify.phone.length < 9}
              onClick={() => {
                setBooking(prev => ({ ...prev, customerName: tempIdentify.name, customerPhone: tempIdentify.phone }));
                setStep('VEHICLE');
              }}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              Continuar Orçamento
            </button>
          </div>
        )}

        {step === 'VEHICLE' && (
          <div className="space-y-6 animate-enter">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">Informações do Veículo</h3>
              <p className="text-sm text-gray-500 text-center mb-6">Conte-nos um pouco sobre sua máquina.</p>
            </div>

            <div className="space-y-4">
              <input
                placeholder="Qual a cor do carro?"
                className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white"
                value={quoteData.vehicleColor}
                onChange={e => setQuoteData({ ...quoteData, vehicleColor: e.target.value })}
              />
              <input
                placeholder="Modelo e ano?"
                className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white"
                value={quoteData.vehicleModelYear}
                onChange={e => setQuoteData({ ...quoteData, vehicleModelYear: e.target.value })}
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-500/20">
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                <span className="font-bold">Aviso:</span> O valor exato só pode ser confirmado após a inspeção presencial do profissional.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-700 dark:text-gray-300">Fotos do Veículo (Frente, Trás, Lados, Teto)</p>
              <div className="grid grid-cols-4 gap-2">
                {quoteData.vehiclePhotos.map((p, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={p} className="w-full h-full object-cover" />
                    <button onClick={() => removePhoto(i, 'vehiclePhotos')} className="absolute top-1 right-1 size-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-[10px]">close</span>
                    </button>
                  </div>
                ))}
                <label className="aspect-square border-2 border-dashed border-gray-300 dark:border-white/10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <input type="file" multiple accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'vehiclePhotos')} />
                  <span className="material-symbols-outlined text-gray-400">add_a_photo</span>
                </label>
              </div>
            </div>

            <button
              disabled={!quoteData.vehicleColor || !quoteData.vehicleModelYear || quoteData.vehiclePhotos.length === 0}
              onClick={() => setStep('SERVICES')}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              Próximo: Escolher Serviços
            </button>
          </div>
        )}

        {step === 'SERVICES' && (
          <div className="space-y-6 animate-enter">
            <section className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">Tipos de Polimento</h3>
                <p className="text-sm text-gray-500 text-center mb-6">Escolha o nível de proteção e brilho para sua pintura.</p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    id: 'COMERCIAL',
                    title: 'Comercial',
                    desc: 'Utilizando uma etapa esse polimento abre o brilho da pintura, elimina arranhões superficiais e mascara os mais profundos após isso é aplicado um selante cerâmico com proteção de até 7 meses.'
                  },
                  {
                    id: 'TECNICO',
                    title: 'Polimento Técnico',
                    desc: 'Com várias etapas eliminamos o máximo de arranhões possíveis de acordo com a espessura do verniz, trazendo assim um brilho extremo a pintura, após o polimento a pintura é vitrificada (Coating Nano-Cerâmico a base de SIO2) para proteger e promover muito mais brilho e hidrorepelência com duração de até 3 anos.'
                  },
                  {
                    id: 'MAQUIAGEM',
                    title: 'Maquiagem Automotiva',
                    desc: 'Cera de alta tecnologia e performance aplicada na pintura que promove brilho intenso e máscara a maior parte dos defeitos, com proteção contra o tempo e hidrorepelência que duram até 4 meses.'
                  },
                  {
                    id: 'LOCALIZADO',
                    title: 'Polimento Localizado',
                    desc: 'Pensado em eliminar ou amenizar arranhões mais profundos ou muito chamativos numa área localizada. Requer no mínimo duas fotos (uma de perto e outra da região).'
                  }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setQuoteData({ ...quoteData, polishingType: quoteData.polishingType === p.id ? '' : p.id as any })}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${quoteData.polishingType === p.id ? 'bg-primary/10 border-primary ring-1 ring-primary' : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-white/10'}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`font-bold ${quoteData.polishingType === p.id ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>{p.title}</span>
                      {quoteData.polishingType === p.id && <span className="material-symbols-outlined text-primary text-sm">check_circle</span>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">{p.desc}</p>
                  </button>
                ))}
              </div>

              {quoteData.polishingType === 'LOCALIZADO' && (
                <div className="space-y-3 animate-enter p-4 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20">
                  <p className="text-sm font-bold text-orange-700 dark:text-orange-300 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">add_a_photo</span> Fotos do Arranhão (Obrigatório)
                  </p>
                  <p className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">Envie pelo menos 2 fotos: uma de perto do arranhão e outra mostrando a região.</p>
                  <div className="grid grid-cols-4 gap-2">
                    {quoteData.localizedPhotos.map((p, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                        <img src={p} className="w-full h-full object-cover" />
                        <button onClick={() => removePhoto(i, 'localizedPhotos')} className="absolute top-1 right-1 size-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="material-symbols-outlined text-[10px]">close</span>
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square border-2 border-dashed border-orange-300 dark:border-orange-500/20 rounded-lg flex items-center justify-center cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-500/5 transition-colors">
                      <input type="file" multiple accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'localizedPhotos')} />
                      <span className="material-symbols-outlined text-orange-400">add_a_photo</span>
                    </label>
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">Higienização de Estofados</h3>
                <p className="text-xs text-gray-500 text-center mb-2 leading-relaxed">
                  Limpeza processo VSC, extrai sujeira, mata fungos/bactérias. Inclui detalhamento interno.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {['BANCOS', 'CARPETE', 'TETO'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => {
                      const exists = quoteData.upholsteryOptions.includes(opt);
                      setQuoteData({
                        ...quoteData,
                        upholsteryOptions: exists
                          ? quoteData.upholsteryOptions.filter(o => o !== opt)
                          : [...quoteData.upholsteryOptions, opt]
                      });
                    }}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${quoteData.upholsteryOptions.includes(opt) ? 'bg-primary/10 border-primary' : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-white/10'}`}
                  >
                    <span className={`font-bold text-sm ${quoteData.upholsteryOptions.includes(opt) ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>{opt}</span>
                    <span className={`material-symbols-outlined ${quoteData.upholsteryOptions.includes(opt) ? 'text-primary' : 'text-gray-300'}`}>
                      {quoteData.upholsteryOptions.includes(opt) ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-700 dark:text-gray-300">Fotos do Estado (Higienização)</p>
                <div className="grid grid-cols-4 gap-2">
                  {quoteData.upholsteryPhotos.map((p, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img src={p} className="w-full h-full object-cover" />
                      <button onClick={() => removePhoto(i, 'upholsteryPhotos')} className="absolute top-1 right-1 size-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-[10px]">close</span>
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square border-2 border-dashed border-gray-300 dark:border-white/10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <input type="file" multiple accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'upholsteryPhotos')} />
                    <span className="material-symbols-outlined text-gray-400">add_a_photo</span>
                  </label>
                </div>
              </div>
            </section>

            <div className="flex gap-3 pt-6">
              <button onClick={() => setStep('VEHICLE')} className="flex-1 py-4 text-gray-500 font-bold">Voltar</button>
              <button
                disabled={loading ||
                  (!quoteData.polishingType && quoteData.upholsteryOptions.length === 0) ||
                  (quoteData.polishingType === 'LOCALIZADO' && quoteData.localizedPhotos.length < 2)
                }
                onClick={handleSubmit}
                className="flex-[2] bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Solicitar Orçamento'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const SelectServicesScreen: React.FC<{
  booking: BookingState;
  setBooking: React.Dispatch<React.SetStateAction<BookingState>>;
  onNext: () => void;
  onBack: () => void;
  services: Service[];
}> = ({ booking, setBooking, onNext, onBack, services }) => {
  const toggleService = (service: Service) => {
    setBooking(prev => {
      const exists = prev.selectedServices.find(s => s.id === service.id);
      if (exists) {
        // Also remove extras for this service
        const newExtras = { ...prev.selectedExtras };
        delete newExtras[service.id];
        return { ...prev, selectedServices: prev.selectedServices.filter(s => s.id !== service.id), selectedExtras: newExtras };
      }
      return { ...prev, selectedServices: [...prev.selectedServices, service] };
    });
  };

  const toggleExtra = (serviceId: string, extra: ServiceExtra) => {
    setBooking(prev => {
      const extras = prev.selectedExtras[serviceId] || [];
      const exists = extras.find(e => e.id === extra.id);
      if (exists) {
        return {
          ...prev,
          selectedExtras: {
            ...prev.selectedExtras,
            [serviceId]: extras.filter(e => e.id !== extra.id)
          }
        };
      }
      return {
        ...prev,
        selectedExtras: {
          ...prev.selectedExtras,
          [serviceId]: [...extras, extra]
        }
      };
    });
  };

  const totalPrice = booking.selectedServices.reduce((sum, s) => {
    const extras = booking.selectedExtras[s.id] || [];
    const extrasTotal = extras.reduce((esum, e) => esum + e.price, 0);
    return sum + s.price + extrasTotal;
  }, 0);

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-gray-200 dark:border-white/5 flex items-center p-4 transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center pr-10 text-slate-900 dark:text-white">Serviços</h2>
      </header>
      <main className="flex-1 p-4 pb-48 max-w-md mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold mb-2 text-slate-900 dark:text-white">Escolha o Serviço</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Selecione um ou mais serviços para o seu agendamento.</p>
        </div>
        <div className="mb-8 space-y-4">
          <input
            type="tel"
            placeholder="(00) 00000-0000"
            value={booking.customerPhone}
            onChange={(e) => {
              const val = e.target.value;
              setBooking(prev => ({ ...prev, customerPhone: val }));
              if (val.length >= 8) {
                supabase.from('clients')
                  .select('name')
                  .eq('phone', val)
                  .single()
                  .then(({ data }) => {
                    if (data && data.name) {
                      setBooking(prev => ({ ...prev, customerName: data.name }));
                    }
                  });
              }
            }}
            className="w-full rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-primary focus:border-primary placeholder:text-gray-400"
          />
          <input
            type="text"
            placeholder="Seu nome completo"
            value={booking.customerName}
            onChange={(e) => setBooking({ ...booking, customerName: e.target.value })}
            className="w-full rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-primary focus:border-primary placeholder:text-gray-400"
          />
        </div>
        <div className="space-y-4">
          {services.map(service => {
            const isSelected = booking.selectedServices.some(s => s.id === service.id);
            return (
              <div key={service.id} className={`flex flex-col rounded-xl bg-white dark:bg-surface-dark border transition-all ${isSelected ? 'border-primary shadow-md' : 'border-gray-200 dark:border-transparent'} overflow-hidden`}>
                <label className="flex gap-4 p-4 cursor-pointer">
                  <div className="size-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0">
                    <img
                      src={service.imageUrl}
                      onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center'); e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined text-gray-400">image_not_supported</span>'; }}
                      className="w-full h-full object-cover"
                      alt={service.name}
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{service.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 mt-1">{service.description}</p>
                    <div className="flex justify-between mt-2">
                      <span className="text-primary font-bold text-sm">R$ {service.price.toFixed(2)}</span>
                      <span className="text-gray-500 text-xs flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> {formatDuration(service.duration)}</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleService(service)}
                    className="hidden"
                  />
                </label>

                {/* Extras selection */}
                {isSelected && service.extras && service.extras.length > 0 && (
                  <div className="bg-primary/5 dark:bg-white/5 p-4 pt-2 border-t border-primary/10 transition-all animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-[10px] font-bold text-primary dark:text-white uppercase tracking-wider mb-2">Adicionais Sugeridos</p>
                    <div className="space-y-2">
                      {service.extras.map(extra => {
                        const isExtraSelected = (booking.selectedExtras[service.id] || []).some(e => e.id === extra.id);
                        return (
                          <button
                            key={extra.id}
                            onClick={() => toggleExtra(service.id, extra)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition-all ${isExtraSelected ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-white/5 text-slate-700 dark:text-gray-300'}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm">{isExtraSelected ? 'check_box' : 'check_box_outline_blank'}</span>
                              <span className="text-xs font-bold">{extra.name}</span>
                            </div>
                            <span className={`text-[10px] font-bold ${isExtraSelected ? 'text-white/80' : 'text-primary'}`}>+ R$ {extra.price.toFixed(2)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-3 mt-8">
            <span className="material-symbols-outlined text-blue-500 shrink-0">info</span>
            <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
              Para realizar um polimento, é necessário fazer um orçamento personalizado, retorne ao menu inicial e selecione o botão <strong>"Fazer orçamento personalizado"</strong>.
            </p>
          </div>
        </div>
      </main>
      <footer className="fixed bottom-0 w-full bg-white/95 dark:bg-surface-dark/95 backdrop-blur-lg border-t border-gray-100 dark:border-white/5 p-5 pb-8 transition-colors">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-gray-500 dark:text-gray-400 text-xs">Total estimado</span>
            <span className="text-2xl font-bold text-primary">R$ {totalPrice.toFixed(2)}</span>
          </div>
          <button
            disabled={booking.selectedServices.length === 0 || !booking.customerName}
            onClick={onNext}
            className="flex-1 bg-primary text-white font-bold py-3.5 px-6 rounded-lg shadow-lg disabled:opacity-50"
          >
            Continuar
          </button>
        </div>
      </footer>
    </div>
  );
};

const SelectDateTimeScreen: React.FC<{
  booking: BookingState;
  setBooking: React.Dispatch<React.SetStateAction<BookingState>>;
  onNext: () => void;
  onBack: () => void;
}> = ({ booking, setBooking, onNext, onBack }) => {
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const nextDays = useMemo(() => getNextDays(14), []);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);
  const [workHours, setWorkHours] = useState<any[]>([]);
  const [minAdvance, setMinAdvance] = useState(0);
  const [bookingMode, setBookingMode] = useState<'SAME_DAY' | 'DIFFERENT_DAYS'>('SAME_DAY');

  useEffect(() => {
    const initData = async () => {
      // Fetch Work Hours
      const { data: wh } = await supabase.from('work_hours').select('*');
      if (wh) setWorkHours(wh);

      // Fetch Blocks
      const { data: blocks } = await supabase.from('blocked_slots').select('*');
      if (blocks) {
        setBlockedSlots(blocks.map((b: any) => ({
          ...b,
          time: b.time?.slice(0, 5) || b.time
        })));
      }

      // Fetch Appointments with Service Durations
      const { data: apps } = await supabase
        .from('appointments')
        .select('*, services:appointment_services(service:services(duration))')
        .neq('status', 'CANCELLED');

      if (apps) {
        const mappedApps = await Promise.all(apps.map(async (a: any) => {
          // Calculate total duration for this existing appointment using stacking logic
          const durationsMap = new Map<number, number>();
          (a.services || []).forEach((item: any) => {
            const d = item.service?.duration || 30;
            durationsMap.set(d, d);
          });
          const baseDuration = (Array.from(durationsMap.values()).reduce((sum, d) => sum + d, 0)) || 30;

          const { data: extras } = await supabase.from('appointment_extras').select('duration').eq('appointment_id', a.id);
          const extrasDuration = extras?.reduce((sum, e) => sum + (e.duration || 0), 0) || 0;

          return {
            ...a,
            date: a.appointment_date,
            time: a.appointment_time?.slice(0, 5) || a.appointment_time,
            duration: baseDuration + extrasDuration
          };
        }));
        setExistingAppointments(mappedApps);
      }

      // Fetch Settings: min_advance_minutes
      const { data: settingsData } = await supabase.from('settings').select('*').eq('key', 'min_advance_minutes').single();
      if (settingsData) {
        setMinAdvance(parseInt(settingsData.value) || 0); // Default 0
      }
    };
    initData();
  }, []);

  useEffect(() => {
    const selectedDateStr = nextDays[selectedDateIndex].dateStr;
    const dateObj = new Date(selectedDateStr + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();

    const dayConfig = workHours.find(w => w.day_of_week === dayOfWeek);

    if (!dayConfig || !dayConfig.is_open) {
      setAvailableTimes([]);
      return;
    }

    const times: string[] = [];
    const step = 15;

    // The required duration for a slot to be shown is the MAXIMUM duration among chosen services.
    const myDuration = Math.max(...booking.selectedServices.map(s => {
      const sExtras = booking.selectedExtras[s.id] || [];
      return s.duration + sExtras.reduce((sum, e) => sum + e.duration, 0);
    })) || 30;

    // We intentionally do not block already selected slots so they don't disappear from the grid.
    const allExistingAppointments = [...existingAppointments];

    const generateSlots = (start: string, end: string) => {
      if (!start || !end) return;
      let [h, m] = start.slice(0, 5).split(':').map(Number);
      const [endH, endM] = end.slice(0, 5).split(':').map(Number);

      const shiftStartMins = h * 60 + m; // Start of the shift
      const shiftEndMins = endH * 60 + endM; // End of the shift

      const toMins = (t: string) => {
        const [hh, mm] = t.split(':').map(Number);
        return hh * 60 + mm;
      };

      const toleranceMins = Number(localStorage.getItem('booking_tolerance') || '45');
      const lunchStartStr = localStorage.getItem('lunch_start') || '';
      const lunchEndStr = localStorage.getItem('lunch_end') || '';

      const lunchStartMins = lunchStartStr ? toMins(lunchStartStr) : null;
      const lunchEndMins = lunchEndStr ? toMins(lunchEndStr) : null;

      while (true) {
        const currentSlotStart = h * 60 + m;

        // --- 1. Shift End Check ---
        // If duration is <= 1 day, it must fit in the current shift (considering tolerance)
        if (myDuration <= 1440) {
          if (currentSlotStart + myDuration > (shiftEndMins + toleranceMins)) break;
        } else {
          // If duration is > 1 day, it just needs to START within the shift
          if (currentSlotStart >= shiftEndMins) break;
        }

        // --- 2. Lunch Check (Only for single-day services) ---
        if (myDuration <= 1440 && lunchStartMins !== null && lunchEndMins !== null) {
          const slotEndMins = currentSlotStart + myDuration;

          // Case A: Slot starts before lunch and ends after lunch starts (exceeding tolerance)
          if (currentSlotStart < lunchStartMins && slotEndMins > (lunchStartMins + toleranceMins)) {
            // Skip this slot
            m += step;
            if (m >= 60) { h += Math.floor(m / 60); m %= 60; }
            continue;
          }

          // Case B: Slot starts during lunch
          if (currentSlotStart >= lunchStartMins && currentSlotStart < lunchEndMins) {
            m += step;
            if (m >= 60) { h += Math.floor(m / 60); m %= 60; }
            continue;
          }
        }

        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

        const now = new Date();
        const isToday = selectedDateStr === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        let isPast = false;

        if (isToday) {
          const nowMins = now.getHours() * 60 + now.getMinutes();
          if (currentSlotStart <= (nowMins + minAdvance)) isPast = true;
        }

        let isBlocked = false;
        if (!isPast) {
          for (const bloc of blockedSlots) {
            if (bloc.date === selectedDateStr) {
              const blockStart = toMins(bloc.time);
              // Check if THIS start time is blocked (use a 1-min window for check)
              if (currentSlotStart >= blockStart && currentSlotStart < (blockStart + 15)) {
                isBlocked = true;
                break;
              }
            }
          }

          if (!isBlocked) {
            const slotStart = new Date(`${selectedDateStr}T${timeStr}:00`).getTime();

            // Check for ANY overlap in the window [slotStart, slotStart + myDuration]
            const overlappingApps = allExistingAppointments.filter(app => {
              if (app.status === 'CANCELLED') return false;
              if (app.date !== selectedDateStr) return false;

              const appStart = new Date(`${app.date}T${app.time}:00`).getTime();
              const appEnd = appStart + (app.duration * 60000);
              const slotEnd = slotStart + (myDuration * 60000);

              // OVERLAP LOGIC:
              // For new appointment (slotStart to slotEnd)
              // and existing appointment (appStart to appEnd)
              // They overlap if the start of one is before the end of the other, AND the end of one is after the start of the other
              return (slotStart < appEnd && slotEnd > appStart);
            });

            if (overlappingApps.length > 0) {
              // If there is ANY overlap, this slot is completely blocked
              isBlocked = true;
            }
          }
        }

        if (!isPast && !isBlocked) {
          times.push(timeStr);
        }

        m += step;
        if (m >= 60) {
          h += Math.floor(m / 60);
          m = m % 60;
        }
      }
    };

    if (dayConfig.is_morning_open !== false) {
      generateSlots(dayConfig.start_time_1, dayConfig.end_time_1);
    }
    if (dayConfig.start_time_2 && dayConfig.end_time_2 && dayConfig.is_afternoon_open !== false) {
      generateSlots(dayConfig.start_time_2, dayConfig.end_time_2);
    }

    setAvailableTimes(times);

  }, [selectedDateIndex, blockedSlots, workHours, existingAppointments, booking.selectedServices, minAdvance, booking.selectedSlots, bookingMode]);

  const handleTimeSelect = (time: string) => {
    const selectedDateStr = nextDays[selectedDateIndex].dateStr;
    const currentSlots = booking.selectedSlots || [];

    // Check if clicking an already selected slot
    const existingIndex = currentSlots.findIndex(s => s.time === time && s.date === selectedDateStr);
    if (existingIndex >= 0) {
      if (bookingMode === 'SAME_DAY') {
        // Deselect all
        setBooking({ ...booking, selectedSlots: [] });
      } else {
        // Deselect one
        const newSlots = currentSlots.filter((_, i) => i !== existingIndex);
        setBooking({ ...booking, selectedSlots: newSlots });
      }
      return;
    }

    // Limit check
    if (currentSlots.length >= booking.selectedServices.length) {
      alert('Você já selecionou a quantidade necessária de horários para os serviços escolhidos.');
      return;
    }

    // Shift check boundaries
    const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const lunchStartStr = localStorage.getItem('lunch_start') || '12:00';
    const lunchStartMins = toMins(lunchStartStr);

    const timeMins = toMins(time);
    const isMorning = timeMins < lunchStartMins;

    if (bookingMode === 'SAME_DAY' && booking.selectedServices.length === 2) {
      // Find counterpart in the availableTimes array on the same day
      const counterpartSlot = availableTimes.find(t => {
        const tMins = toMins(t);
        const tIsMorning = tMins < lunchStartMins;
        return isMorning !== tIsMorning; // must be in the opposite shift
      });

      if (!counterpartSlot) {
        alert('Infelizmente não há horários disponíveis nos dois turnos para este dia. Escolha a opção "Dias Diferentes" ou navegue para outro dia.');
        return;
      }

      // We have both! Auto-select them.
      const s1 = booking.selectedServices[0];
      const s2 = booking.selectedServices[1];

      const newSlots = [];
      if (isMorning) {
        newSlots.push({ serviceId: s1.id, date: selectedDateStr, time: time });
        newSlots.push({ serviceId: s2.id, date: selectedDateStr, time: counterpartSlot });
      } else {
        newSlots.push({ serviceId: s1.id, date: selectedDateStr, time: counterpartSlot });
        newSlots.push({ serviceId: s2.id, date: selectedDateStr, time: time });
      }
      setBooking({ ...booking, selectedSlots: newSlots, selectedDate: newSlots[0].date, selectedTime: newSlots[0].time });

    } else {
      // DIFFERENT_DAYS or fallback
      const hasSameDaySameShift = currentSlots.some(s => {
        if (s.date !== selectedDateStr) return false;
        const sMins = toMins(s.time);
        const sIsMorning = sMins < lunchStartMins;
        return isMorning === sIsMorning;
      });

      if (hasSameDaySameShift) {
        alert('Você só pode selecionar um horário por turno (manhã/tarde) no mesmo dia.');
        return;
      }

      // Map to the first unassigned service
      const assignedServiceIds = currentSlots.map(s => s.serviceId);
      const nextService = booking.selectedServices.find(s => !assignedServiceIds.includes(s.id));
      if (!nextService) return;

      const newSlots = [...currentSlots, { serviceId: nextService.id, date: selectedDateStr, time }];
      setBooking({ ...booking, selectedSlots: newSlots, selectedDate: newSlots[0]?.date || '', selectedTime: newSlots[0]?.time || '' });
    }
  };

  const selectedDateStr = nextDays[selectedDateIndex].dateStr;
  const currentSlotsOnDate = (booking.selectedSlots || []).filter(s => s.date === selectedDateStr);

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="p-4 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-background-dark flex items-center justify-between transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <div className="flex flex-col items-center">
          <span className="font-bold text-slate-900 dark:text-white">Escolha os Horários</span>
          <span className="text-xs text-primary font-bold text-center">
            {booking.selectedServices.length > 1 ? `Selecione ${booking.selectedServices.length} horários` : ''}
          </span>
        </div>
        <div className="size-10"></div>
      </header>
      {booking.selectedServices.length > 1 && (
        <div className="p-4 bg-white dark:bg-background-dark border-b border-gray-200 dark:border-white/5 flex gap-2 justify-center transition-colors">
          <button
            onClick={() => { setBookingMode('SAME_DAY'); setBooking({ ...booking, selectedSlots: [] }); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${bookingMode === 'SAME_DAY' ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-md' : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'}`}
          >
            No mesmo dia
          </button>
          <button
            onClick={() => { setBookingMode('DIFFERENT_DAYS'); setBooking({ ...booking, selectedSlots: [] }); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${bookingMode === 'DIFFERENT_DAYS' ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-md' : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'}`}
          >
            Dias diferentes
          </button>
        </div>
      )}
      <main className="p-4 flex-1">
        <h3 className="text-slate-900 dark:text-white font-bold mb-4">Dias Disponíveis</h3>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 mb-6">
          {nextDays.map((d, i) => (
            <button
              key={i}
              onClick={() => setSelectedDateIndex(i)}
              className={`min-w-[70px] p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${selectedDateIndex === i
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-white/5 text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
                }`}
            >
              <span className="text-[10px] font-bold uppercase">{d.weekDay}</span>
              <span className="text-xl font-bold">{d.dayNum}</span>
            </button>
          ))}
        </div>

        <h3 className="text-slate-900 dark:text-white font-bold mb-4">Horários Livres</h3>
        <div className="grid grid-cols-4 gap-3">
          {availableTimes.map((t) => {
            const isSelected = currentSlotsOnDate.some(s => s.time === t);
            return (
              <button
                key={t}
                onClick={() => handleTimeSelect(t)}
                className={`p-3 rounded-xl border font-bold text-sm transition-all ${isSelected
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white shadow-md'
                  : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-white/5 text-slate-900 dark:text-white hover:border-gray-300 dark:hover:border-white/20'
                  }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </main>
      <footer className="p-4 mt-auto border-t border-gray-200 dark:border-white/5 bg-white dark:bg-background-dark transition-colors">
        <button
          onClick={onNext}
          disabled={booking.selectedSlots?.length !== booking.selectedServices.length}
          className="w-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 flex flex-col items-center justify-center gap-1"
        >
          <span>Continuar</span>
          {(booking.selectedSlots?.length || 0) < booking.selectedServices.length && (
            <span className="text-[10px] font-normal opacity-80">
              Faltam {(booking.selectedServices.length - (booking.selectedSlots?.length || 0))} horários
            </span>
          )}
        </button>
      </footer>
    </div>
  );
};

const AdminFinanceScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [dateRange, setDateRange] = useState({
    start: format(startOfDay(new Date()), 'yyyy-MM-01'),
    end: format(startOfDay(new Date()), 'yyyy-MM-dd')
  });

  // No local 'stats' state. We use derived state (useMemo) for instant updates.

  const [expenses, setExpenses] = useState<any[]>([]);
  const [rawAppointments, setRawAppointments] = useState<any[]>([]);

  // Expenses Inputs
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Produto');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses'>('dashboard');

  const loadData = async () => {
    // 1. Fetch Expenses
    const { data: expData } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    if (expData) setExpenses(expData);

    // 2. Fetch Appointments
    const { data: appData } = await supabase
      .from('appointments')
      .select('*, services:appointment_services(service:services(name)), clients(name)')
      .eq('status', 'COMPLETED');

    if (appData) {
      const mappedApps = appData.map((a: any) => ({
        ...a,
        date: a.appointment_date,
        services: a.services.map((s: any) => ({ name: s.service.name })),
        clientName: a.clients?.name || 'Cliente'
      }));
      setRawAppointments(mappedApps);
      // No processStats call here. React will auto-calculate via useMemo.
    }
  };

  useEffect(() => { loadData(); }, []);

  // --- DERIVED STATE (STATS) ---
  const stats = useMemo(() => {
    // Filter by Date Range
    const filteredApps = rawAppointments.filter(a => a.date >= dateRange.start && a.date <= dateRange.end);
    const filteredExps = expenses.filter(e => e.date >= dateRange.start && e.date <= dateRange.end);

    // 1. Revenue & Expenses
    const revenue = filteredApps.reduce((sum, a) => sum + a.total_price, 0);
    const totalExpenses = filteredExps.reduce((sum, e) => sum + e.amount, 0);
    const profit = revenue - totalExpenses;

    // 2. Ticket Average
    const count = filteredApps.length;
    const ticketAverage = count > 0 ? revenue / count : 0;

    // 3. Projection (Current Month)
    const today = new Date();
    const isCurrentMonth = dateRange.start.substring(0, 7) === today.toISOString().substring(0, 7);
    let projection = 0;
    if (isCurrentMonth) {
      const daysPassed = today.getDate();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      if (daysPassed > 0) {
        projection = (revenue / daysPassed) * daysInMonth;
      }
    }

    // 4. Comparison (Previous Month)
    const prevStart = format(addDays(parseISO(dateRange.start), -30), 'yyyy-MM-dd');
    const prevEnd = format(addDays(parseISO(dateRange.end), -30), 'yyyy-MM-dd');
    const prevRevenue = rawAppointments
      .filter(a => a.date >= prevStart && a.date <= prevEnd)
      .reduce((sum, a) => sum + a.total_price, 0);

    // 5. Trend Chart (Daily)
    const dailyMap: any = {};
    filteredApps.forEach(a => {
      dailyMap[a.date] = (dailyMap[a.date] || 0) + a.total_price;
    });
    const revenueHistory = Object.entries(dailyMap)
      .map(([date, total]) => ({ date: format(parseISO(date), 'dd/MM'), total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 6. Service Ranking
    const serviceMap: any = {};
    filteredApps.forEach(a => {
      a.services.forEach((s: any) => {
        serviceMap[s.name] = (serviceMap[s.name] || 0) + 1;
      });
    });
    const serviceRanking = Object.entries(serviceMap)
      .map(([name, count]) => ({ name, count: Number(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 7. Top Clients
    const clientMap: any = {};
    filteredApps.forEach(a => {
      clientMap[a.clientName] = (clientMap[a.clientName] || 0) + a.total_price;
    });
    const topClients = Object.entries(clientMap)
      .map(([name, total]) => ({ name, total: Number(total) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // 8. LTV (Lifetime Value) - Based on ALL data
    const allUniqueClients = new Set(rawAppointments.map(a => a.client_id)).size;
    const allTimeRevenue = rawAppointments.reduce((sum, a) => sum + a.total_price, 0);
    const ltv = allUniqueClients > 0 ? allTimeRevenue / allUniqueClients : 0;

    // 9. Seasonal Data (Traffic by Day of Week)
    const weekCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    filteredApps.forEach(a => {
      const day = parseISO(a.date).getDay();
      weekCounts[day as keyof typeof weekCounts] += 1;
    });
    const daysLabel = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const seasonalData = Object.entries(weekCounts).map(([day, count]) => ({
      day: daysLabel[Number(day)],
      count: count
    }));

    return {
      revenue,
      expenses: totalExpenses,
      profit,
      ticketAverage,
      projection,
      prevMonthRevenue: prevRevenue,
      revenueHistory,
      serviceRanking,
      topClients,
      ltv,
      seasonalData
    };
  }, [rawAppointments, expenses, dateRange]);

  const handleMonthFilter = (monthOffset: number) => {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), monthOffset, 1);
    const start = format(startOfDay(targetDate), 'yyyy-MM-01');
    const end = format(addDays(new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0), 0), 'yyyy-MM-dd');
    setDateRange({ start, end });
  }

  const handleAddExpense = async () => {
    if (!desc || !amount) return alert('Preencha descrição e valor');
    const { error } = await supabase.from('expenses').insert({
      description: desc,
      amount: parseFloat(amount),
      category,
      date: new Date().toISOString().split('T')[0]
    });

    if (error) alert('Erro ao adicionar: ' + error.message);
    else {
      setDesc(''); setAmount('');
      loadData();
      alert('Despesa adicionada!');
    }
  };

  const handleDeleteExpense = (id: string) => {
    if (!window.confirm('Deletar despesa?')) return;
    supabase.from('expenses').delete().eq('id', id)
      .then(() => loadData());
  };

  const handlePrint = () => {
    window.print();
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors print:bg-white print:p-0">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 flex items-center justify-between backdrop-blur-md transition-colors print:hidden">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-slate-900 dark:text-white">Financeiro Avançado</h2>
        <button onClick={handlePrint} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">print</span></button>
      </header>

      <main className="p-4 space-y-6 max-w-4xl mx-auto w-full pb-24 print:max-w-none print:pb-0">

        {/* Date Filter & Quick Filters */}
        <div className="space-y-3 print:hidden">
          <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs font-bold text-gray-500 uppercase">Início</label>
              <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 rounded-lg p-2 text-slate-900 dark:text-white border border-gray-200 dark:border-white/10" />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs font-bold text-gray-500 uppercase">Fim</label>
              <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 rounded-lg p-2 text-slate-900 dark:text-white border border-gray-200 dark:border-white/10" />
            </div>
          </div>

          {/* Quick Month Selectors */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, idx) => {
              // Fix: Parse manually to avoid Timezone issues with new Date("YYYY-MM-DD")
              const [y, M] = dateRange.start.split('-').map(Number);
              const currentYear = new Date().getFullYear();
              const isActive = (M - 1) === idx && y === currentYear;

              return (
                <button
                  key={m}
                  onClick={() => handleMonthFilter(idx)}
                  className={`px-4 py-2 border rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${isActive
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-slate-900 dark:text-white'
                    }`}
                >
                  {m}
                </button>
              );
            })}
          </div>

        </div>


        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-xl print:hidden">
          <button onClick={() => setActiveTab('dashboard')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white dark:bg-surface-dark shadow text-slate-900 dark:text-white' : 'text-gray-500'}`}>Dashboard</button>
          <button onClick={() => setActiveTab('expenses')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'expenses' ? 'bg-white dark:bg-surface-dark shadow text-slate-900 dark:text-white' : 'text-gray-500'}`}>Despesas</button>
        </div>

        {
          activeTab === 'dashboard' ? (
            <div className="space-y-6 animate-fade-in">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-bold">Faturamento</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">R$ {stats.revenue.toFixed(2)}</h3>
                  {stats.prevMonthRevenue > 0 && (
                    <p className={`text-xs font-bold mt-1 ${stats.revenue >= stats.prevMonthRevenue ? 'text-green-500' : 'text-red-500'}`}>
                      {stats.revenue >= stats.prevMonthRevenue ? '▲' : '▼'} vs mês anterior
                    </p>
                  )}
                </div>
                <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-bold">Lucro Líquido</p>
                  <h3 className={`text-2xl font-black ${stats.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>R$ {stats.profit.toFixed(2)}</h3>
                  <p className="text-xs text-gray-400 mt-1">Margem: {stats.revenue > 0 ? ((stats.profit / stats.revenue) * 100).toFixed(0) : 0}%</p>
                </div>
                <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-bold">Ticket Médio</p>
                  <h3 className="text-2xl font-black text-blue-500">R$ {stats.ticketAverage.toFixed(2)}</h3>
                  <p className="text-xs text-gray-400 mt-1">por atendimento</p>
                </div>
                <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-bold">LTV (Lifetime Value)</p>
                  <h3 className="text-2xl font-black text-purple-500">R$ {stats.ltv.toFixed(2)}</h3>
                  <p className="text-xs text-gray-400 mt-1">Média por cliente</p>
                </div>
              </div>

              {/* Main Charts Row */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Trend Chart */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm min-h-[300px]">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">Tendência de Receita</h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.revenueHistory}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#222', borderRadius: '8px', border: 'none', color: '#fff' }}
                          formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']}
                        />
                        <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Seasonality Chart */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm min-h-[300px]">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">📊 Fluxo de Agendamentos (Filtro Atual)</h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.seasonalData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="day" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#222', borderRadius: '8px', border: 'none', color: '#fff' }}
                          formatter={(value: number) => [`${value}`, 'Agendamentos']}
                        />
                        <Bar dataKey="count" fill="#FF8042" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Tables Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Top Services */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">Top Serviços</h3>
                  <div className="space-y-3">
                    {stats.serviceRanking.map((s: any, idx: number) => (
                      <div key={s.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`size-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>
                            {idx + 1}
                          </div>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{s.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-500">{s.count} agend.</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Clients */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">Top 5 Clientes</h3>
                  <div className="space-y-3">
                    {stats.topClients.map((c: any, idx: number) => (
                      <div key={c.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold bg-primary/10 text-primary`}>
                            {c.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[120px]">{c.name}</span>
                        </div>
                        <span className="text-sm font-bold text-green-600">R$ {c.total.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm print:hidden">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Adicionar Despesa</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descrição (ex: Energia)" className="col-span-2 bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" />
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Valor (R$)" className="bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" />
                  <select value={category} onChange={e => setCategory(e.target.value)} className="bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white">
                    <option>Produto</option>
                    <option>Infraestrutura</option>
                    <option>Marketing</option>
                    <option>Pessoal</option>
                    <option>Outros</option>
                  </select>
                </div>
                <button onClick={handleAddExpense} className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20">Adicionar Despesa</button>
              </div>

              <div className="space-y-3">
                {expenses.map(e => (
                  <div key={e.id} className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-white/5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{e.description}</p>
                      <p className="text-xs text-gray-500">{e.category} • {formatDateToBRL(e.date)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-red-500">- R$ {e.amount.toFixed(2)}</span>
                      <button onClick={() => handleDeleteExpense(e.id)} className="size-8 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 flex items-center justify-center print:hidden"><span className="material-symbols-outlined text-lg">delete</span></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        }

      </main >
    </div >
  );
};

const AdminBlockScheduleScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);

  const fetchBlocks = async () => {
    const { data } = await supabase.from('blocked_slots').select('*');
    if (data) setBlockedSlots(data);
  };

  useEffect(() => { fetchBlocks(); }, []);

  const handleBlock = async () => {
    if (!date || !time) return alert('Selecione data e hora');
    const { error } = await supabase.from('blocked_slots').insert({
      date,
      time,
      reason: reason || 'Bloqueado pelo Admin'
    });

    if (error) {
      alert('Erro ao bloquear: ' + error.message);
    } else {
      setDate(''); setTime(''); setReason('');
      fetchBlocks();
      alert('Horário bloqueado!');
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Liberar este horário?')) return;
    supabase.from('blocked_slots').delete().eq('id', id)
      .then(() => fetchBlocks());
  };

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 flex items-center justify-between backdrop-blur-md transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-slate-900 dark:text-white">Bloquear Agenda</h2>
        <div className="size-10"></div>
      </header>
      <main className="p-4 space-y-6 max-w-md mx-auto w-full">
        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl space-y-3 border border-gray-200 dark:border-white/10 transition-colors">
          <h3 className="font-bold text-slate-900 dark:text-white">Novo Bloqueio</h3>
          <input type="date" className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" value={date} onChange={e => setDate(e.target.value)} />
          <input type="time" className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" value={time} onChange={e => setTime(e.target.value)} />
          <input type="text" className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" placeholder="Motivo (opcional)" value={reason} onChange={e => setReason(e.target.value)} />
          <button onClick={handleBlock} className="w-full bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 py-3 rounded-lg font-bold border border-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/30 transition-colors">Bloquear Horário</button>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">Bloqueios Ativos</h3>
          {blockedSlots.map(b => (
            <div key={b.id} className="bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/5 flex justify-between items-center transition-colors">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{new Date(b.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {b.time}</p>
                <p className="text-xs text-gray-500">{b.reason}</p>
              </div>
              <button onClick={() => handleDelete(b.id)} className="text-gray-400 hover:text-red-500 dark:hover:text-white transition-colors"><span className="material-symbols-outlined">delete</span></button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

const ReviewScreen: React.FC<{
  booking: BookingState;
  onConfirm: () => void;
  onBack: () => void;
}> = ({ booking, onConfirm, onBack }) => {
  const totalPrice = booking.selectedServices.reduce((sum, s) => {
    const extras = booking.selectedExtras[s.id] || [];
    const extrasTotal = extras.reduce((esum, e) => esum + e.price, 0);
    return sum + s.price + extrasTotal;
  }, 0);
  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col pb-24 transition-colors">
      <header className="sticky top-0 z-50 flex items-center p-4 bg-white/95 dark:bg-background-dark/95 border-b border-gray-200 dark:border-white/5 transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10">
          <span className="material-symbols-outlined text-gray-600 dark:text-white">arrow_back_ios_new</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center pr-10 text-slate-900 dark:text-white">Revisar Agendamento</h2>
      </header>
      <main className="p-4 space-y-6 max-w-md mx-auto w-full">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Confira os detalhes</h1>
          <p className="text-sm text-gray-500 mt-1">Verifique as informações antes de confirmar.</p>
        </div>
        <section className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="p-4 flex gap-4 items-center">
            <div className="size-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center"><span className="material-symbols-outlined">person</span></div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-bold">Cliente</span>
              <p className="font-medium text-sm text-slate-900 dark:text-white">{booking.customerName} • {booking.customerPhone}</p>
            </div>
          </div>
          <div className="p-4 flex flex-col gap-4 border-t border-gray-100 dark:border-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center"><span className="material-symbols-outlined text-lg">calendar_month</span></div>
              <span className="text-[10px] text-gray-500 uppercase font-bold">Datas e Horários</span>
            </div>
            <div className="pl-12 space-y-3">
              {booking.selectedSlots?.map((slot, idx) => {
                const service = booking.selectedServices.find(s => s.id === slot.serviceId);
                return (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/10">
                    <span className="text-xs font-bold text-slate-800 dark:text-gray-200">{service?.name}</span>
                    <span className="text-xs text-primary font-bold">{formatDateToBRL(slot.date)} • {slot.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        <section className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-white/5 p-5 shadow-sm transition-colors">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-slate-900 dark:text-white"><span className="material-symbols-outlined text-primary text-xl">receipt_long</span> Resumo</h3>
          <div className="space-y-4">
            {booking.selectedServices.map(s => {
              const extras = booking.selectedExtras[s.id] || [];
              return (
                <div key={s.id} className="space-y-1">
                  <div className="flex justify-between text-sm text-slate-900 dark:text-white font-bold">
                    <span>{s.name}</span>
                    <span>R$ {s.price.toFixed(2)}</span>
                  </div>
                  {extras.map(e => (
                    <div key={e.id} className="flex justify-between text-[11px] text-gray-500 italic pl-4">
                      <span>+ {e.name}</span>
                      <span>R$ {e.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="my-5 border-t border-gray-200 dark:border-white/10 border-dashed"></div>
          <div className="flex justify-between items-center">
            <p className="text-gray-500 font-medium">Total a pagar</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">R$ {totalPrice.toFixed(2)}</p>
          </div>
        </section>
      </main>
      <footer className="fixed bottom-0 w-full p-4 bg-white/95 dark:bg-background-dark border-t border-gray-200 dark:border-white/5 z-40 transition-colors">
        <button onClick={onConfirm} className="w-full bg-primary h-14 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 group shadow-lg shadow-primary/20 active:scale-[0.98] transition-all">
          <span>Confirmar Agendamento</span>
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </footer>
    </div >
  );
};

const MyAppointmentsScreen: React.FC<{
  appointments: Appointment[];
  onBack: () => void;
  onNew: () => void;
  onRefresh: () => void;
}> = ({ appointments, onBack, onNew, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentTime = now.getHours() * 60 + now.getMinutes();

    return appointments.filter(app => {
      // Date comparison
      if (app.date > currentDate) return activeTab === 'upcoming';
      if (app.date < currentDate) return activeTab === 'past';

      // If date is today, check time
      const [h, m] = app.time.split(':').map(Number);
      const appTime = h * 60 + m;

      if (activeTab === 'upcoming') {
        return appTime > currentTime;
      } else {
        return appTime <= currentTime;
      }
    }).sort((a, b) => { // Sort
      if (activeTab === 'upcoming') {
        // Ascending for upcoming
        return (a.date + a.time).localeCompare(b.date + b.time);
      } else {
        // Descending for past
        return (b.date + b.time).localeCompare(a.date + a.time);
      }
    });
  }, [appointments, activeTab]);

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-20 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 flex items-center transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"><span className="material-symbols-outlined text-gray-600 dark:text-white">arrow_back_ios_new</span></button>
        <h1 className="text-lg font-bold flex-1 text-center pr-10 text-slate-900 dark:text-white">Meus Agendamentos</h1>
      </header>
      <main className="p-4 space-y-6 max-w-md mx-auto w-full flex-1">
        <div className="flex bg-gray-100 dark:bg-surface-dark p-1 rounded-xl transition-colors">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'upcoming' ? 'bg-primary text-white shadow-sm' : 'text-gray-500'}`}
          >
            Próximos
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'past' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-gray-500'}`}
          >
            Anteriores
          </button>
        </div>
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
            <span className="material-symbols-outlined text-primary">calendar_today</span>
            {activeTab === 'upcoming' ? 'Agendamentos Futuros' : 'Histórico'}
          </h2>

          {filteredAppointments.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-surface-dark/30 rounded-3xl border border-gray-200 dark:border-white/5 border-dashed transition-colors">
              <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-700 mb-2">event_busy</span>
              <p className="text-gray-500 text-sm">Nenhum agendamento {activeTab === 'upcoming' ? 'marcado' : 'encontrado'}.</p>
            </div>
          ) : (
            filteredAppointments.map(app => (
              <div key={app.id} className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-white/5 mb-4 overflow-hidden shadow-sm relative hover:border-primary/20 dark:hover:border-white/10 transition-all">
                <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold rounded-bl-xl tracking-wider uppercase ${app.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/20 text-green-700 dark:text-green-400'
                  }`}>{app.status}</div>
                <div className="p-4 flex gap-4">
                  <div className={`size-16 rounded-xl flex flex-col items-center justify-center border transition-colors ${activeTab === 'past' ? 'bg-gray-100 border-gray-200 opacity-70' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'
                    }`}>
                    <span className="text-[10px] font-bold uppercase text-gray-500">Dia</span>
                    <span className="text-xl font-bold text-slate-900 dark:text-white">{app.date.split('-')[2]}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{app.services?.[0]?.name || 'Serviço não especificado'} {app.services?.length > 1 ? `+ ${app.services.length - 1} serviço` : ''}</h3>
                    <div className="flex flex-col gap-1 mt-2">
                      <p className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_month</span> {formatDateToBRL(app.date)}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> {app.time}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02] transition-colors">
                  <span className="font-bold text-slate-900 dark:text-white">R$ {app.totalPrice.toFixed(2)}</span>
                  {activeTab === 'upcoming' && (
                    <button
                      onClick={async () => {
                        if (window.confirm('Deseja realmente cancelar este agendamento?')) {
                          const { error } = await supabase.from('appointments').delete().eq('id', app.id);
                          if (error) {
                            console.error('Erro ao cancelar:', error);
                            alert('Não foi possível cancelar o agendamento.');
                          } else {
                            onRefresh();
                          }
                        }
                      }}
                      className="text-primary text-xs font-bold uppercase flex items-center gap-1 hover:opacity-80 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-sm">cancel</span> Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </section>
        <div className="mt-8 p-6 rounded-3xl bg-primary/5 border border-primary/20 text-center shadow-sm">
          <div className="p-4 bg-primary/10 rounded-2xl inline-flex text-primary mb-4 shadow-inner"><span className="material-symbols-outlined text-[32px]">add_circle</span></div>
          <h3 className="font-bold text-lg mb-1 text-slate-900 dark:text-white">Novo Agendamento</h3>
          <p className="text-sm text-gray-500 mb-6 px-4">Precisa de um trato no visual? Escolha um novo serviço e horário.</p>
          <button onClick={onNew} className="w-full py-3.5 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all">Agendar Horário</button>
        </div>
      </main>
    </div>
  );
};

// --- Chat Screens ---

const AdminChatListScreen: React.FC<{ onBack: () => void; onSelectChat: (clientId: string, clientName: string) => void }> = ({ onBack, onSelectChat }) => {
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    const fetchConvos = async () => {
      // Fetch all messages and group by client on frontend mostly for simplicity (or use a view in Supabase in real app)
      // We'll fetch all unique clients from messages

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, clients!chat_messages_client_id_fkey(name, phone)')
        .order('sent_at', { ascending: false });

      if (data) {
        const convos: any[] = [];
        const clientIds = new Set();

        data.forEach((msg: any) => {
          if (msg.client_id && !clientIds.has(msg.client_id)) {
            clientIds.add(msg.client_id);
            convos.push({
              id: String(msg.client_id),
              name: msg.clients?.name || 'Unknown',
              phone: msg.clients?.phone || '',
              last_message: msg.sent_at,
              // msg_count: ... 
            });
          }
        });
        setConversations(convos);
      }
    };

    fetchConvos();
    const interval = setInterval(fetchConvos, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark flex items-center justify-between backdrop-blur-md transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-slate-900 dark:text-white">Conversas</h2>
        <div className="size-10"></div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-2">
        {conversations.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">Nenhuma conversa iniciada.</div>
        ) : (conversations.map(c => (
          <button key={c.id} onClick={() => onSelectChat(c.id, c.name)} className="w-full bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-200 dark:border-white/5 flex gap-4 items-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm">
            <div className="size-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-lg font-bold border border-primary/20">
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-slate-900 dark:text-white truncate">{c.name}</h3>
                <span className="text-[10px] text-gray-400">{new Date(c.last_message).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.phone}</p>
            </div>
          </button>
        )))}
      </main>
    </div>
  );
};

const ChatScreen: React.FC<{
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onRegister: (identity: { name: string, phone: string }) => void;
  onBack: () => void;
  currentUserRole: 'CUSTOMER' | 'BARBER';
  customerIdentity?: { name: string; phone: string };
  chatClientId?: string; // For Admin
}> = ({ messages, onSendMessage, onRegister, onBack, currentUserRole, customerIdentity, chatClientId }) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Local state for identifying customer if not provided
  const [tempName, setTempName] = useState('');
  const [tempPhone, setTempPhone] = useState('');

  // Determine if we need identity. 
  // If Customer role and no identity provided via props, show form.
  const needsIdentity = currentUserRole === 'CUSTOMER' && !customerIdentity?.phone;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, needsIdentity]);

  const handleStartChat = () => {
    if (!tempName || !tempPhone) {
      alert("Por favor, informe seu nome e telefone para iniciar o chat.");
      return;
    }
    onRegister({ name: tempName, phone: tempPhone });
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const otherPersonName = currentUserRole === 'CUSTOMER' ? 'Renan Sandes' : (customerIdentity?.name || 'Cliente');
  const otherPersonRole = currentUserRole === 'CUSTOMER' ? 'Barbeiro' : 'Cliente';

  if (needsIdentity) {
    return (
      <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col p-6 max-w-md mx-auto w-full justify-center transition-colors">
        <button onClick={onBack} className="absolute top-6 left-6 size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <div className="text-center mb-8">
          <div className="size-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20"><span className="material-symbols-outlined text-4xl filled">chat</span></div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quase lá!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Para falar com o gerente, precisamos saber quem é você.</p>
        </div>
        <div className="space-y-4">
          <input value={tempName} onChange={e => setTempName(e.target.value)} className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white placeholder:text-gray-400" placeholder="Seu Nome" />
          <input value={tempPhone} onChange={e => setTempPhone(e.target.value)} className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white placeholder:text-gray-400" placeholder="Seu Telefone (WhatsApp)" />
          <button onClick={handleStartChat} className="w-full bg-primary py-4 rounded-xl font-bold shadow-lg shadow-primary/20 text-white">Iniciar Chat</button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark h-screen flex flex-col transition-colors">
      <header className="p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 flex items-center gap-3 transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="size-10 rounded-full bg-gray-200 dark:bg-surface-dark border border-gray-200 dark:border-white/5 flex items-center justify-center overflow-hidden">
          <img src={currentUserRole === 'CUSTOMER' ? "/renan.png" : "/logo.png"} alt="Avatar" className="h-full w-full object-cover" />
        </div>
        <div>
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">{otherPersonName}</h2>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-green-500"></span>
            <span className="text-[10px] text-gray-500 font-bold uppercase">{otherPersonRole} Online</span>
          </div>
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-gray-50 dark:bg-background-dark transition-colors">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === currentUserRole ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === currentUserRole
              ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10'
              : 'bg-white dark:bg-surface-dark text-slate-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-white/5 shadow-sm'
              }`}>
              {msg.text}
              <div className={`text-[10px] mt-1 opacity-50 ${msg.sender === currentUserRole ? 'text-right' : 'text-left'}`}>
                {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </main>

      <footer className="p-4 bg-white/95 dark:bg-surface-dark/50 border-t border-gray-200 dark:border-white/5 pb-8 transition-colors">
        <div className="max-w-md mx-auto flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-gray-100 dark:bg-surface-dark border-transparent dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary text-slate-900 dark:text-white placeholder:text-gray-400"
          />
          <button
            onClick={handleSend}
            className="size-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined filled">send</span>
          </button>
        </div>
      </footer>
    </div>
  );
};



const AdminWeeklyScheduleScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDay, setEditingDay] = useState<any | null>(null);
  const [interval, setInterval] = useState('15');
  const [minAdvance, setMinAdvance] = useState('0');

  const fetchSchedule = async () => {
    // Fetch Work Hours
    const { data: wh } = await supabase
      .from('work_hours')
      .select('*')
      .order('day_of_week');

    if (wh) setSchedule(wh);

    // Fetch Interval
    const { data: settingsData } = await supabase.from('settings').select('*').eq('key', 'interval_minutes').single();
    if (settingsData) setInterval(settingsData.value);

    // Fetch Min Advance
    const { data: advData } = await supabase.from('settings').select('*').eq('key', 'min_advance_minutes').single();
    if (advData) setMinAdvance(advData.value);

    setLoading(false);
  };

  useEffect(() => { fetchSchedule(); }, []);

  const handleToggleDay = async (day: any) => {
    const newVal = !day.is_open;
    // Optimistic
    setSchedule(prev => prev.map(d => d.id === day.id ? { ...d, is_open: newVal } : d));

    await supabase.from('work_hours').update({ is_open: newVal }).eq('id', day.id);
  };

  const handleSaveDay = async () => {
    if (!editingDay) return;
    const { error } = await supabase.from('work_hours').update({
      start_time_1: editingDay.start_time_1,
      end_time_1: editingDay.end_time_1,
      start_time_2: editingDay.start_time_2,
      end_time_2: editingDay.end_time_2,
      is_morning_open: editingDay.is_morning_open,
      is_afternoon_open: editingDay.is_afternoon_open
    }).eq('id', editingDay.id);

    if (error) alert('Erro ao salvar: ' + error.message);
    else {
      setEditingDay(null);
      fetchSchedule();
    }
  };

  const handleSaveInterval = async (newInterval: string) => {
    setInterval(newInterval);
    await supabase.from('settings').upsert({ key: 'interval_minutes', value: newInterval });
  };

  const handleSaveMinAdvance = async (newVal: string) => {
    setMinAdvance(newVal);
    await supabase.from('settings').upsert({ key: 'min_advance_minutes', value: newVal });
  };

  const dayNames = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-primary text-white flex items-center justify-between shadow-md">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-white/20 text-white"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-lg">Horários de Atendimento</h2>
        <div className="size-10"></div>
      </header>

      <main className="p-4 space-y-4 max-w-md mx-auto w-full pb-24">
        {/* Interval Setting */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-surface-dark p-4 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
            <label className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest block mb-1">Intervalo</label>
            <select
              value={interval}
              onChange={e => handleSaveInterval(e.target.value)}
              className="w-full bg-gray-50 dark:bg-background-dark p-2 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-primary/50 transition-colors"
            >
              <option value="15">15 min</option>
              <option value="20">20 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hora</option>
            </select>
          </div>
          <div className="bg-white dark:bg-surface-dark p-4 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
            <label className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest block mb-1">Antecedência</label>
            <select
              value={minAdvance}
              onChange={e => handleSaveMinAdvance(e.target.value)}
              className="w-full bg-gray-50 dark:bg-background-dark p-2 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-primary/50 transition-colors"
            >
              <option value="0">Nenhuma</option>
              <option value="30">30 min</option>
              <option value="60">1 hora</option>
              <option value="120">2 horas</option>
              <option value="240">4 horas</option>
            </select>
          </div>
        </div>

        <h3 className="text-[11px] text-gray-500 font-bold uppercase pt-2 px-1">Semana</h3>

        {loading ? <div className="text-center p-10">Carregando...</div> : schedule.map(day => (
          <div key={day.id} className={`bg-gray-100 dark:bg-surface-dark rounded-3xl p-5 border ${day.is_open ? 'border-transparent' : 'border-gray-300 opacity-75'} transition-all`}>
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-slate-800 dark:text-white capitalize">{dayNames[day.day_of_week]}</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase text-gray-400">{day.is_open ? '' : 'Não Atendendo'}</span>
                <button
                  onClick={() => handleToggleDay(day)}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors ${day.is_open ? 'bg-green-500' : 'bg-gray-400'}`}
                >
                  <div className={`h-5 w-5 bg-white rounded-full shadow-sm transition-transform ${day.is_open ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between bg-white dark:bg-black/20 p-4 rounded-2xl">
              {day.is_open ? (
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm font-bold text-slate-700 dark:text-gray-300">
                  <span>{day.start_time_1?.slice(0, 5)}</span>
                  <span>{day.end_time_1?.slice(0, 5)}</span>
                  {day.start_time_2 && day.end_time_2 && (
                    <>
                      <span>{day.start_time_2?.slice(0, 5)}</span>
                      <span>{day.end_time_2?.slice(0, 5)}</span>
                    </>
                  )}
                </div>
              ) : (
                <span className="text-sm font-bold text-gray-400">Fechado</span>
              )}

              <button onClick={() => setEditingDay(day)} className="size-8 flex items-center justify-center text-gray-400 hover:text-primary">
                <span className="material-symbols-outlined">edit</span>
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* Edit Modal */}
      {editingDay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm px-6">
          <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-up">
            <h3 className="font-bold text-xl mb-6 text-slate-900 dark:text-white text-center">Editar {dayNames[editingDay.day_of_week]}</h3>

            <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-2xl border border-gray-100 dark:border-white/5 space-y-4">
              {/* Morning Shift */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">wb_sunny</span>
                    Manhã
                  </label>
                  <button
                    onClick={() => setEditingDay({ ...editingDay, is_morning_open: !editingDay.is_morning_open })}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors ${editingDay.is_morning_open ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <div className={`h-4 w-4 bg-white rounded-full shadow-sm transition-transform ${editingDay.is_morning_open ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                <div className={`grid grid-cols-2 gap-2 text-center transition-all duration-300 ${!editingDay.is_morning_open && 'opacity-40 grayscale pointer-events-none'}`}>
                  <input type="time" className="bg-white dark:bg-background-dark p-3 rounded-xl font-bold text-center border border-gray-200 dark:border-white/10" value={editingDay.start_time_1} onChange={e => setEditingDay({ ...editingDay, start_time_1: e.target.value })} />
                  <input type="time" className="bg-white dark:bg-background-dark p-3 rounded-xl font-bold text-center border border-gray-200 dark:border-white/10" value={editingDay.end_time_1} onChange={e => setEditingDay({ ...editingDay, end_time_1: e.target.value })} />
                </div>
              </div>

              <div className="h-px bg-gray-200 dark:bg-white/10"></div>

              {/* Afternoon Shift */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">wb_twilight</span>
                    Tarde
                  </label>
                  <button
                    onClick={() => setEditingDay({ ...editingDay, is_afternoon_open: !editingDay.is_afternoon_open })}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors ${editingDay.is_afternoon_open ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <div className={`h-4 w-4 bg-white rounded-full shadow-sm transition-transform ${editingDay.is_afternoon_open ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                <div className={`grid grid-cols-2 gap-2 text-center transition-all duration-300 ${!editingDay.is_afternoon_open && 'opacity-40 grayscale pointer-events-none'}`}>
                  <input type="time" className="bg-white dark:bg-background-dark p-3 rounded-xl font-bold text-center border border-gray-200 dark:border-white/10" value={editingDay.start_time_2 || ''} onChange={e => setEditingDay({ ...editingDay, start_time_2: e.target.value })} />
                  <input type="time" className="bg-white dark:bg-background-dark p-3 rounded-xl font-bold text-center border border-gray-200 dark:border-white/10" value={editingDay.end_time_2 || ''} onChange={e => setEditingDay({ ...editingDay, end_time_2: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button onClick={() => setEditingDay(null)} className="flex-1 py-3.5 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleSaveDay} className="flex-1 py-3.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminSettingsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('19:00');
  const [interval, setInterval] = useState('30');
  const [lunchStart, setLunchStart] = useState('');
  const [lunchEnd, setLunchEnd] = useState('');
  const [profileName, setProfileName] = useState('Renan Sandes');
  const [profileImage, setProfileImage] = useState('/renan.png');
  const [companyName, setCompanyName] = useState('Garagem Detail');
  const [companyTagline, setCompanyTagline] = useState('Seu estilo, no seu tempo. Agende seu corte em segundos.');
  const [companyAddress, setCompanyAddress] = useState('Rua Osman Loureiro, 33\nCentro, Água Branca - AL');
  const [tolerance, setTolerance] = useState('45');

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.from('settings').select('*');
      if (data) {
        const s: any = {};
        data.forEach((r: any) => s[r.key] = r.value);
        setStartTime(s.start_time || '09:00');
        setEndTime(s.end_time || '19:00');
        setInterval(s.interval_minutes || '30');
        setLunchStart(s.lunch_start || '');
        setLunchEnd(s.lunch_end || '');
        setProfileName(s.profile_name || 'Renan Sandes');
        setProfileImage(s.profile_image || '/renan.png');
        setCompanyName(s.company_name || 'Garagem Detail');
        setCompanyTagline(s.company_tagline || 'Seu estilo, no seu tempo. Agende seu corte em segundos.');
        setCompanyAddress(s.company_address || 'Rua Osman Loureiro, 33\nCentro, Água Branca - AL');
        setTolerance(s.booking_tolerance || '45');
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    const updates = [
      { key: 'start_time', value: startTime },
      { key: 'end_time', value: endTime },
      { key: 'interval_minutes', value: interval },
      { key: 'lunch_start', value: lunchStart },
      { key: 'lunch_end', value: lunchEnd },
      { key: 'profile_name', value: profileName },
      { key: 'profile_image', value: profileImage },
      { key: 'company_name', value: companyName },
      { key: 'company_tagline', value: companyTagline },
      { key: 'company_address', value: companyAddress },
      { key: 'booking_tolerance', value: tolerance }
    ];

    const { error } = await supabase.from('settings').upsert(updates);

    if (error) alert('Erro ao salvar: ' + error.message);
    else {
      alert('Configurações salvas!');
      localStorage.setItem('company_name', companyName);
      localStorage.setItem('company_tagline', companyTagline);
      localStorage.setItem('company_address', companyAddress);
      localStorage.setItem('profile_name', profileName);
      localStorage.setItem('profile_image', profileImage);
      localStorage.setItem('booking_tolerance', tolerance);
    }
  };

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark flex items-center justify-between backdrop-blur-md transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-slate-900 dark:text-white">Configuração</h2>
        <div className="size-10"></div>
      </header>
      <main className="p-4 space-y-6 max-w-md mx-auto w-full pb-24">
        <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-200 dark:border-white/10 space-y-4 transition-colors shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><span className="material-symbols-outlined text-primary">storefront</span> Identidade Visual</h3>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Nome da Empresa</label>
            <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" placeholder="Ex: Garagem Detail" />
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Tagline / Descrição (Landing Page)</label>
            <textarea value={companyTagline} onChange={e => setCompanyTagline(e.target.value)} className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" rows={2} placeholder="Ex: Seu estilo, no seu tempo..." />
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Endereço da Empresa</label>
            <textarea value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" rows={2} placeholder="Ex: Rua Tal, 123..." />
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-white/5"></div>
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><span className="material-symbols-outlined text-primary">person</span> Perfil do Profissional</h3>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Nome do Profissional</label>
            <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" placeholder="Ex: Renan Sandes" />
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-1">URL da Foto</label>
            <input type="text" value={profileImage} onChange={e => setProfileImage(e.target.value)} className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" placeholder="Ex: /renan.png ou link externo" />
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-white/5"></div>
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><span className="material-symbols-outlined text-primary">schedule</span> Configuração da Agenda</h3>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Horário de Abertura</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Horário de Fechamento</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Intervalo entre Cortes (min)</label>
            <select value={interval} onChange={e => setInterval(e.target.value)} className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white">
              <option value="15">15 minutos</option>
              <option value="20">20 minutos</option>
              <option value="30">30 minutos</option>
              <option value="40">40 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">1 hora</option>
            </select>
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Início do Almoço (Opcional)</label>
            <input type="time" value={lunchStart} onChange={e => setLunchStart(e.target.value)} className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Fim do Almoço (Opcional)</label>
            <input type="time" value={lunchEnd} onChange={e => setLunchEnd(e.target.value)} className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-1">Tolerância de Finalização (min)</label>
            <select value={tolerance} onChange={e => setTolerance(e.target.value)} className="w-full bg-gray-50 dark:bg-background-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white">
              <option value="0">Sem tolerância</option>
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">1 hora</option>
              <option value="90">1 hora e 30 min</option>
              <option value="120">2 horas</option>
            </select>
            <p className="text-[10px] text-gray-400 mt-1 italic">Tempo extra permitido além do fim do expediente ou início do almoço para concluir um serviço.</p>
          </div>
          <button onClick={handleSave} className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 mt-4 active:scale-[0.98] transition-all">Salvar Alterações</button>
        </div>
      </main>
    </div>
  );
};



const LoginScreen: React.FC<{ onLogin: () => void; onBack: () => void }> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [remember, setRemember] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) { setError('Preencha todos os campos'); return; }
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      console.error('Login error:', error.message);
      setError(error.message === 'Invalid login credentials' ? 'Email ou senha inválidos' : 'Erro ao fazer login');
    } else if (data.user) {
      if (remember) {
        // Supabase persists by default, but we can respect the checkbox logic if we wanted to manipulate storage
        // For now, we rely on standard persistence or just setting our local flag if needed for other logic
        localStorage.setItem('admin_auth', 'true');
      }
      onLogin();
    }
  };

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col p-6 max-w-md mx-auto w-full transition-colors">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-white transition-colors"><span className="material-symbols-outlined">arrow_back_ios_new</span></button>
        <h2 className="text-lg font-bold flex-1 text-center pr-10 text-slate-900 dark:text-white">Login</h2>
      </div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Painel Administrativo</h1>
        <p className="text-gray-500 dark:text-gray-400">Gerencie sua Garagem Detail com facilidade e profissionalismo.</p>
      </div>
      <div className="flex flex-col items-center mb-10">
        <div className="size-24 rounded-full bg-white dark:bg-surface-dark border-4 border-gray-100 dark:border-white/5 flex items-center justify-center overflow-hidden relative group shadow-lg transition-colors">
          {/* <span className="material-symbols-outlined text-4xl text-gray-500">person</span> */}
          <img src={localStorage.getItem('profile_image') || "/renan.png"} className="h-full w-full object-cover" />
          <div className="absolute bottom-0 right-0 bg-primary p-1.5 rounded-full border-2 border-white dark:border-background-dark shadow-md"><span className="material-symbols-outlined text-xs text-white">photo_camera</span></div>
        </div>
        <span className="text-primary text-sm font-bold mt-3">{localStorage.getItem('profile_name') || "Renan Sandes"}</span>
      </div>
      <div className="space-y-4 mb-10">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">alternate_email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-white dark:bg-surface-dark border-transparent h-14 pl-12 pr-4 focus:ring-primary focus:border-primary transition-all text-sm text-slate-900 dark:text-white placeholder:text-gray-400 shadow-sm"
            placeholder="E-mail profissional"
            type="email"
          />
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">lock</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-white dark:bg-surface-dark border-transparent h-14 pl-12 pr-4 focus:ring-primary focus:border-primary transition-all text-sm text-slate-900 dark:text-white placeholder:text-gray-400 shadow-sm"
            placeholder="Senha"
            type="password"
          />
        </div>
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="remember"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="remember" className="text-sm text-gray-500 dark:text-gray-400">Manter conectado</label>
        </div>

        {error && <p className="text-red-500 text-sm font-bold text-center mb-4">{error}</p>}
      </div>
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-primary h-14 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        <span>{loading ? 'Entrando...' : 'Acessar Painel'}</span> <span className="material-symbols-outlined">arrow_forward</span>
      </button>
    </div>
  );
};

const AdminCalendarView: React.FC<{
  appointments: Appointment[];
  selectedDateStr: string;
  onDateChange: (dateStr: string) => void;
  onAppointmentClick: (app: Appointment) => void;
  workHours: any[];
}> = ({ appointments, selectedDateStr, onDateChange, onAppointmentClick, workHours }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Constants
  const START_HOUR = 8;
  const END_HOUR = 20;
  const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
  const PIXELS_PER_MINUTE = 2; // Increased for better visibility (120px per hour)

  // Filter apps for selected date (Robust string comparison)
  // Filter apps that overlap with the selected date
  const dayApps = appointments.filter(app => {
    if (app.status === 'CANCELLED') return false;

    const selectedDateStart = new Date(`${selectedDateStr}T00:00:00`).getTime();
    const selectedDateEnd = selectedDateStart + (24 * 60 * 60000);

    const allExtras = Object.values(app.selectedExtras || {}).flat() as any[];
    const baseDuration = app.services.reduce((sum, s) => sum + s.duration, 0);
    const extrasDuration = allExtras.reduce((sum: number, e: any) => sum + e.duration, 0) as number;
    const totalDuration = (baseDuration + extrasDuration) || 30;
    const appStart = new Date(`${app.date}T${app.time}:00`).getTime();
    const appEnd = appStart + (totalDuration * 60000);

    // Overlap condition: app starts before date ends and ends after date starts
    return appStart < selectedDateEnd && appEnd > selectedDateStart;
  });

  // Helper to calculate position
  // Helper to calculate position for the current day
  const getPosition = (appDate: string, appTime: string, duration: number) => {
    const selectedDateStart = new Date(`${selectedDateStr}T00:00:00`).getTime();
    const appStart = new Date(`${appDate}T${appTime}:00`).getTime();
    const appEnd = appStart + (duration * 60000);
    const dayStart = selectedDateStart + (START_HOUR * 60 * 60000);
    const dayEnd = selectedDateStart + (END_HOUR * 60 * 60000);

    // Calculate relative start and end within the visible day window
    const visibleStart = Math.max(appStart, dayStart);
    const visibleEnd = Math.min(appEnd, dayEnd);

    if (visibleEnd <= visibleStart) return null;

    const topMinutes = (visibleStart - dayStart) / 60000;
    const heightMinutes = (visibleEnd - visibleStart) / 60000;

    return {
      top: topMinutes * PIXELS_PER_MINUTE,
      height: heightMinutes * PIXELS_PER_MINUTE,
      isContinuesPrevious: appStart < dayStart,
      isContinuesNext: appEnd > dayEnd
    };
  };

  const timeSlots = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    timeSlots.push(h);
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-background-dark">
        <button onClick={() => {
          const current = parseISO(selectedDateStr);
          onDateChange(format(addDays(current, -1), 'yyyy-MM-dd'));
        }} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-slate-900 dark:text-white">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
            {format(parseISO(selectedDateStr), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h3>
        </div>
        <button onClick={() => {
          const current = parseISO(selectedDateStr);
          onDateChange(format(addDays(current, 1), 'yyyy-MM-dd'));
        }} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-slate-900 dark:text-white">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto relative no-scrollbar" style={{ height: '600px' }} ref={containerRef}>
        <div className="flex w-full relative min-h-full">
          {/* Time Sidebar */}
          <div className="w-16 flex-shrink-0 border-r border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-background-dark/50 z-10 sticky left-0">
            {timeSlots.map(h => (
              <div key={h} className="h-[120px] text-xs font-medium text-gray-500 text-right pr-2 pt-2 border-b border-gray-100 dark:border-white/5 relative">
                <span className="-top-3 relative">{h}:00</span>
              </div>
            ))}
          </div>

          {/* Events Area */}
          <div className="flex-1 relative bg-white dark:bg-surface-dark bg-[linear-gradient(to_bottom,transparent_119px,rgba(0,0,0,0.05)_120px)] dark:bg-[linear-gradient(to_bottom,transparent_119px,rgba(255,255,255,0.05)_120px)] bg-[size:100%_120px]">
            {dayApps.map(app => {
              const allExtras = Object.values(app.selectedExtras || {}).flat() as any[];
              const baseDuration = app.services.reduce((sum, s) => sum + s.duration, 0);
              const extrasDuration = allExtras.reduce((sum: number, e: any) => sum + e.duration, 0) as number;
              const totalDuration = (baseDuration + extrasDuration) || 30;
              const pos = getPosition(app.date, app.time, totalDuration);
              if (!pos) return null;

              return (
                <div
                  key={app.id}
                  onClick={() => onAppointmentClick(app)}
                  className={`absolute left-2 right-2 rounded-lg p-2 border-l-4 shadow-sm cursor-pointer hover:brightness-95 transition-all
                      ${app.status === 'COMPLETED' ? 'bg-green-100 border-green-500 text-green-900' :
                      app.status === 'CONFIRMED' ? 'bg-blue-100 border-blue-500 text-blue-900' :
                        'bg-yellow-100 border-yellow-500 text-yellow-900'}
                      ${pos.isContinuesPrevious ? 'rounded-t-none border-t border-dashed border-t-black/10' : ''}
                      ${pos.isContinuesNext ? 'rounded-b-none border-b border-dashed border-b-black/10' : ''}
                    `}
                  style={{ top: `${pos.top}px`, height: `${pos.height}px`, zIndex: 20 }}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs truncate">{app.customerName}</span>
                    <span className="text-[10px] font-mono opacity-80">
                      {pos.isContinuesPrevious ? 'cont...' : app.time}
                    </span>
                  </div>
                  <div className="text-[10px] opacity-90 truncate mt-0.5">
                    {app.services.map(s => s.name).join(', ')}
                    {Object.values(app.selectedExtras || {}).flat().length > 0 && (
                      <span className="font-bold">
                        {" + "}{Object.values(app.selectedExtras || {}).flat().map((e: any) => e.name).join(' + ')}
                      </span>
                    )}
                    {pos.isContinuesNext && ' ...'}
                  </div>
                </div>
              );
            })}

            {/* Current Time Line */}
            {selectedDateStr === format(new Date(), 'yyyy-MM-dd') && (() => {
              const now = new Date();
              const minutes = (now.getHours() * 60 + now.getMinutes()) - (START_HOUR * 60);
              if (minutes > 0 && minutes < TOTAL_MINUTES) {
                return (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none flex items-center"
                    style={{ top: `${minutes * PIXELS_PER_MINUTE}px` }}
                  >
                    <div className="size-2 bg-red-500 rounded-full -ml-1"></div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminTVScreen: React.FC<{ appointments: Appointment[]; onBack: () => void; onRefresh: () => void }> = ({ appointments, onBack, onRefresh }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workHours, setWorkHours] = useState<any[]>([]);
  const lastAnnouncedRef = useRef<string | null>(null);

  useEffect(() => {
    supabase.from('work_hours').select('*').then(({ data }) => { if (data) setWorkHours(data); });

    // Clock tick
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const refreshTimer = setInterval(() => onRefresh(), 10000);
    return () => { clearInterval(timer); clearInterval(refreshTimer); };
  }, [onRefresh]);

  const todayStr = format(currentTime, 'yyyy-MM-dd');
  const nowTimeStr = format(currentTime, 'HH:mm');

  // Filter Active Apps
  const activeApps = appointments
    .filter(a => a.date === todayStr && (a.status === 'CONFIRMED' || a.status === 'PENDING'))
    .sort((a, b) => a.time.localeCompare(b.time));

  // --- TTS Logic ---
  useEffect(() => {
    // Check if any app is starting NOW (within this minute)
    const appStartingNow = activeApps.find(a => a.time.startsWith(nowTimeStr));

    if (appStartingNow && lastAnnouncedRef.current !== appStartingNow.id) {
      const text = `Cliente ${appStartingNow.customerName}, seu horário das ${appStartingNow.time.slice(0, 5)} chegou.`;
      const speech = new SpeechSynthesisUtterance(text);
      speech.lang = 'pt-BR';
      window.speechSynthesis.speak(speech);
      lastAnnouncedRef.current = String(appStartingNow.id);
    }
  }, [nowTimeStr, activeApps]);

  // --- Next Slots Logic ---
  // --- Next Slots Logic ---
  const nextSlots = useMemo(() => {
    if (!workHours.length) return [];

    const dow = currentTime.getDay(); // 0=Sun
    // Database uses 0-6 integers for day_of_week
    const todayConfig = workHours.find(w => w.day_of_week === dow);

    if (!todayConfig || !todayConfig.is_open) return [];

    const slots: string[] = [];
    const addSlots = (start: string, end: string) => {
      if (!start || !end) return;

      const toMins = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };

      let currMins = toMins(start.slice(0, 5));
      const endMins = toMins(end.slice(0, 5));

      // Prevent infinite loop: Max 24 hours of slots
      let safetyCounter = 0;
      while (currMins < endMins && safetyCounter < 50) {
        const h = Math.floor(currMins / 60);
        const m = currMins % 60;
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        slots.push(timeStr);
        currMins += 30; // 30 min interval
        safetyCounter++;
      }
    };

    if (todayConfig.is_morning_open) addSlots(todayConfig.start_time_1, todayConfig.end_time_1);
    if (todayConfig.is_afternoon_open) addSlots(todayConfig.start_time_2, todayConfig.end_time_2);

    return slots.filter(slot => {
      if (slot <= nowTimeStr) return false;
      const isTaken = activeApps.some(a => a.time.startsWith(slot));
      return !isTaken;
    }).slice(0, 4);
  }, [workHours, nowTimeStr, activeApps, currentTime]);



  return (
    <div className="bg-slate-900 h-screen w-screen flex flex-col p-6 text-white overflow-hidden relative">
      <header className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 shrink-0 h-[100px]">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-white rounded-full p-2 flex items-center justify-center">
            <img src="/logo.png" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white shadow-black drop-shadow-lg leading-none">Agendamentos</h1>
            <p className="text-lg text-gray-400 uppercase tracking-widest font-bold">{currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-6xl font-black font-mono tracking-widest text-primary drop-shadow-[0_0_15px_rgba(212,17,50,0.5)] leading-none">
            {nowTimeStr}
          </div>
          <button onClick={onBack} className="mt-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-white transition-all">
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 grid grid-cols-[1fr_260px] gap-6">
        {/* Appointments Grid */}
        <div className="overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-min">
            {activeApps.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center p-10 opacity-30 mt-10">
                <span className="material-symbols-outlined text-[80px] mb-4">event_busy</span>
                <h2 className="text-2xl font-bold uppercase tracking-widest text-center">Nenhum agendamento<br />ativo no momento</h2>
              </div>
            ) : (
              activeApps.map(app => {
                const appTimeParts = app.time.split(':');
                const start = new Date(currentTime);
                start.setHours(parseInt(appTimeParts[0]), parseInt(appTimeParts[1]), 0, 0);
                const allExtras = Object.values(app.selectedExtras || {}).flat() as any[];
                const baseDuration = app.services.reduce((acc, s) => acc + s.duration, 0);
                const extrasDuration = allExtras.reduce((acc: number, s: any) => acc + (s.duration || 0), 0) as number;
                const totalDuration = baseDuration + extrasDuration;
                const end = addMinutes(start, totalDuration);
                const isNow = currentTime >= start && currentTime < end;

                return (
                  <div key={app.id} className={`${isNow ? 'bg-yellow-950/40 border-yellow-500 ring-2 ring-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)]' : 'bg-slate-800 border-primary'} rounded-2xl p-4 border-l-[8px] shadow-xl flex flex-col gap-2 relative overflow-hidden transition-all duration-500`}>
                    <div className="absolute top-0 right-0 bg-white/5 px-4 py-2 rounded-bl-2xl">
                      <span className={`font-mono font-black text-2xl tracking-tighter ${isNow ? 'text-yellow-400' : 'text-white'}`}>{app.time.slice(0, 5)}</span>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <div className={`size-14 rounded-xl bg-gradient-to-br ${isNow ? 'from-yellow-600 to-yellow-800 text-white shadow-yellow-900/50' : 'from-slate-700 to-slate-800 shadow-inner'} border border-white/5 flex items-center justify-center text-xl font-black shadow-lg shrink-0`}>
                        {app.customerName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className={`text-xl font-bold truncate leading-tight ${isNow ? 'text-yellow-100' : 'text-white'}`}>{app.customerName}</h3>
                        <p className={`truncate font-mono text-xs opacity-60 ${isNow ? 'text-yellow-200' : 'text-gray-400'}`}>{app.customerPhone}</p>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3 mt-auto">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {app.services.slice(0, 2).map(s => (
                          <span key={s.id} className={`${isNow ? 'bg-yellow-600 text-white shadow-yellow-600/40' : 'bg-primary text-white shadow-primary/20'} px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm`}>
                            {s.name}
                          </span>
                        ))}
                        {Object.values(app.selectedExtras || {}).flat().map((e: any) => (
                          <span key={e.id} className={`${isNow ? 'bg-orange-600 text-white shadow-orange-600/40' : 'bg-orange-500 text-white shadow-orange-500/20'} px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm`}>
                            + {e.name}
                          </span>
                        ))}
                        {app.services.length > 2 && <span className="text-[10px] opacity-70">+{app.services.length - 2}</span>}
                      </div>
                      <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg">
                        <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${isNow ? 'text-yellow-200' : 'text-gray-400'}`}>
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          {formatDuration(baseDuration)}
                          {extrasDuration > 0 && <span className="text-orange-400 font-black"> + {formatDuration(extrasDuration)}</span>}
                        </span>
                        <span className="text-lg font-black text-green-400">R$ {app.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar / Widgets */}
        <div className="flex flex-col gap-4 h-full">
          {/* Quick Schedule QR */}
          <div className="bg-white p-4 rounded-2xl flex flex-col items-center text-center shadow-xl border-4 border-primary/20 shrink-0">
            <h3 className="text-slate-900 font-black uppercase tracking-widest text-xs mb-2">Agende Agora</h3>
            <div className="bg-white p-1 rounded-lg mb-2 w-32 h-32">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(import.meta.env.VITE_SITE_URL || window.location.origin)}`} alt="QR Code" className="w-full h-full rounded" />
            </div>
            <p className="text-slate-500 font-bold text-[10px]">Aponte a câmera</p>
          </div>

          {/* Free Slots */}
          {nextSlots.length > 0 && (
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/10 flex-1 flex flex-col min-h-0">
              <h3 className="text-white/70 font-bold uppercase tracking-widest text-[10px] mb-3 flex items-center gap-2 shrink-0">
                <span className="material-symbols-outlined text-sm">event_available</span>
                Horários Disponíveis
              </h3>
              <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                {nextSlots.map(slot => (
                  <div key={slot} className="bg-slate-700/50 p-2 rounded-lg flex justify-between items-center border border-white/5">
                    <span className="font-mono font-bold text-lg text-green-400">{slot}</span>
                    <span className="text-[10px] uppercase font-bold text-gray-500">Livre</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const AdminQuotesScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const fetchQuotes = async () => {
    setLoading(true);
    let query = supabase
      .from('quotes')
      .select('*, client:clients(name, phone)')
      .order('created_at', { ascending: false });

    if (!showCompleted) {
      query = query.neq('status', 'COMPLETED');
    }

    const { data, error } = await query;
    if (!error && data) {
      setQuotes(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuotes();
  }, [showCompleted]);

  const handleUpdateStatus = async (quoteId: string, status: string) => {
    const { error } = await supabase.from('quotes').update({ status }).eq('id', quoteId);
    if (!error) {
      setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: status as any } : q));
      if (selectedQuote?.id === quoteId) {
        setSelectedQuote(prev => prev ? { ...prev, status: status as any } : null);
      }
    }
  };

  const handleWhatsApp = (phone: string, text: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 flex items-center justify-between backdrop-blur-md transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-slate-900 dark:text-white">Orçamentos Recebidos</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`size-10 rounded-full flex items-center justify-center transition-colors ${showCompleted ? 'bg-primary text-white' : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-500'}`}
            title={showCompleted ? "Esconder Concluídos" : "Mostrar Concluídos"}
          >
            <span className="material-symbols-outlined">{showCompleted ? 'visibility_off' : 'visibility'}</span>
          </button>
          <button onClick={fetchQuotes} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">refresh</span></button>
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-4xl mx-auto w-full pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 opacity-50">
            <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="font-bold uppercase tracking-widest text-xs">Carregando Orçamentos...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 opacity-30 text-center">
            <span className="material-symbols-outlined text-[80px] mb-4">description</span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nenhum orçamento recebido ainda.</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotes.map(quote => (
              <div
                key={quote.id}
                className={`bg-white dark:bg-surface-dark p-4 rounded-3xl border ${quote.status === 'PENDING' ? 'border-primary/20 bg-primary/5' : 'border-gray-100 dark:border-white/5'} shadow-sm hover:shadow-md transition-all cursor-pointer`}
                onClick={() => setSelectedQuote(quote)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center font-bold text-slate-900 dark:text-white">
                      {quote.client?.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{quote.client?.name}</h3>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">
                        {format(parseISO(quote.created_at), "d 'de' MMMM", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${quote.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    quote.status === 'REPLIED' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                    {quote.status === 'PENDING' ? 'Pendente' : quote.status === 'REPLIED' ? 'Respondido' : 'Concluído'}
                  </span>
                </div>

                <div className="flex gap-2 py-2 border-t border-gray-50 dark:border-white/5 mt-2 overflow-x-auto no-scrollbar">
                  {quote.vehicle_photos?.slice(0, 3).map((p, i) => (
                    <img key={i} src={p} className="size-16 rounded-xl object-cover" />
                  ))}
                  {quote.vehicle_photos?.length > 3 && (
                    <div className="size-16 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-xs font-bold text-gray-500">
                      +{quote.vehicle_photos.length - 3}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWhatsApp(quote.client?.phone || '', `Olá ${quote.client?.name}, recebemos seu pedido de orçamento para o seu veículo ${quote.vehicle_model_year}. Podemos conversar sobre os detalhes?`);
                    }}
                    className="flex-1 bg-green-500 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">chat</span> WhatsApp
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Deseja finalizar este orçamento? Ele sairá da lista principal.')) {
                        handleUpdateStatus(quote.id, 'COMPLETED');
                      }
                    }}
                    className="p-2 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20"
                    title="Finalizar"
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedQuote(quote);
                    }}
                    className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Quote Details Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-background-dark w-full max-w-2xl max-h-[90vh] rounded-t-[32px] sm:rounded-[32px] overflow-hidden flex flex-col animate-slide-up">
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-xl text-slate-900 dark:text-white">Detalhes do Orçamento</h3>
              <button onClick={() => setSelectedQuote(null)} className="size-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500"><span className="material-symbols-outlined">close</span></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
              {/* Client Info */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-dark rounded-3xl">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{selectedQuote.client?.name}</h4>
                  <p className="text-sm text-gray-500">{selectedQuote.client?.phone}</p>
                </div>
                <button
                  onClick={() => handleWhatsApp(selectedQuote.client?.phone || '', `Olá ${selectedQuote.client?.name}...`)}
                  className="bg-green-500 text-white p-3 rounded-2xl shadow-lg shadow-green-500/20"
                >
                  <span className="material-symbols-outlined">chat</span>
                </button>
              </div>

              {/* Vehicle Section */}
              <section className="space-y-4">
                <h5 className="font-bold text-primary uppercase text-[10px] tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">directions_car</span> Veículo
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-surface-dark rounded-2xl">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Cor</p>
                    <p className="font-bold text-slate-900 dark:text-white">{selectedQuote.vehicle_color}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-surface-dark rounded-2xl">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Modelo/Ano</p>
                    <p className="font-bold text-slate-900 dark:text-white">{selectedQuote.vehicle_model_year}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {selectedQuote.vehicle_photos?.map((p, i) => (
                    <img key={i} src={p} className="aspect-square rounded-xl object-cover cursor-zoom-in" onClick={() => window.open(p, '_blank')} />
                  ))}
                </div>
              </section>

              {/* Polishing Section */}
              <section className="space-y-4">
                <h5 className="font-bold text-primary uppercase text-[10px] tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">auto_fix_high</span> Polimento
                </h5>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                  <p className="font-bold text-slate-900 dark:text-white mb-1">
                    {selectedQuote.polishing_type === 'COMERCIAL' ? 'Polimento Comercial' :
                      selectedQuote.polishing_type === 'TECNICO' ? 'Polimento Técnico' :
                        selectedQuote.polishing_type === 'LOCALIZADO' ? 'Polimento Localizado' : 'Maquiagem Automotiva'}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed italic">
                    {selectedQuote.polishing_type === 'COMERCIAL' ? 'Etapa única, brilho e selante (7 meses).' :
                      selectedQuote.polishing_type === 'TECNICO' ? 'Várias etapas, correção total e vitrificação (3 anos).' :
                        selectedQuote.polishing_type === 'LOCALIZADO' ? 'Focado em eliminar ou amenizar arranhões profundos em área específica.' : 'Cera premium, máscara defeitos e brilho intenso (4 meses).'}
                  </p>
                </div>
                {selectedQuote.polishing_type === 'LOCALIZADO' && selectedQuote.localized_polishing_photos && selectedQuote.localized_polishing_photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {selectedQuote.localized_polishing_photos.map((p, i) => (
                      <img key={i} src={p} className="aspect-square rounded-xl object-cover cursor-zoom-in" onClick={() => window.open(p, '_blank')} />
                    ))}
                  </div>
                )}
              </section>

              {/* Upholstery Section */}
              <section className="space-y-4">
                <h5 className="font-bold text-primary uppercase text-[10px] tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">chair</span> Higienização de Estofados
                </h5>
                <div className="flex flex-wrap gap-2">
                  {selectedQuote.upholstery_options?.map(opt => (
                    <span key={opt} className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-xl text-xs font-bold text-slate-900 dark:text-white">
                      {opt}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {selectedQuote.upholstery_photos?.map((p, i) => (
                    <img key={i} src={p} className="aspect-square rounded-xl object-cover cursor-zoom-in" onClick={() => window.open(p, '_blank')} />
                  ))}
                </div>
              </section>

              {/* Status Management */}
              <div className="p-4 bg-gray-50 dark:bg-surface-dark rounded-3xl space-y-3">
                <p className="text-[10px] text-gray-400 font-bold uppercase text-center">Alterar Status</p>
                <div className="flex gap-2">
                  {['PENDING', 'REPLIED', 'COMPLETED'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(selectedQuote.id, status)}
                      className={`flex-1 py-3 rounded-2xl text-[10px] font-bold uppercase transition-all ${selectedQuote.status === status
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-white dark:bg-background-dark text-gray-400 border border-gray-100 dark:border-white/5'
                        }`}
                    >
                      {status === 'PENDING' ? 'Pendente' : status === 'REPLIED' ? 'Respondido' : 'Finalizar'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Walk-in Service Modal ---
const AdminWalkInServiceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  categories: VehicleCategory[];
  allServices: any[];
  onSave: (data: {
    customerName: string;
    categoryId: string;
    services: any[];
    extras: any[];
    totalPrice: number;
  }) => void;
}> = ({ isOpen, onClose, categories, allServices, onSave }) => {
  const [customerName, setCustomerName] = useState('Cliente Presencial');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<any[]>([]);
  const [manualPrice, setManualPrice] = useState<string>('');

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setCustomerName('Cliente Presencial');
      setSelectedCategoryId(categories[0]?.id || '');
      setSelectedServices([]);
      setSelectedExtras([]);
      setManualPrice('');
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const currentCategoryServices = allServices.map(s => {
    const price = s.service_prices?.find((p: any) => String(p.category_id) === String(selectedCategoryId))?.price || 0;
    return { ...s, currentPrice: price };
  });

  const calculatedTotal = selectedServices.reduce((sum, s) => sum + s.currentPrice, 0) +
    selectedExtras.reduce((sum, e) => sum + e.price, 0);

  const finalTotal = manualPrice !== '' ? parseFloat(manualPrice) : calculatedTotal;

  const toggleService = (service: any) => {
    if (selectedServices.find(s => s.id === service.id)) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
      // Remove extras for this service too
      setSelectedExtras(selectedExtras.filter(e => String(e.service_id) !== String(service.id)));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const toggleExtra = (extra: any) => {
    if (selectedExtras.find(e => e.id === extra.id)) {
      setSelectedExtras(selectedExtras.filter(e => e.id !== extra.id));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-surface-dark rounded-[40px] w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/2">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Venda Local</h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Sem agendamento</p>
          </div>
          <button onClick={onClose} className="size-10 rounded-full bg-white dark:bg-white/5 shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {/* Customer Info */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Cliente</label>
            <input
              type="text"
              className="w-full bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/10 text-slate-900 dark:text-white font-bold"
              placeholder="Nome do Cliente"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Categoria do Veículo</label>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategoryId(cat.id);
                    // Clear price override/recalculate if needed? Usually services change price.
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${selectedCategoryId === cat.id
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                    : 'bg-white dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Services List */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Serviços Realizados</label>
            <div className="grid gap-3">
              {currentCategoryServices.map(s => {
                const isSelected = selectedServices.some(sv => sv.id === s.id);
                return (
                  <div key={s.id} className="space-y-2">
                    <button
                      onClick={() => toggleService(s)}
                      className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 text-left ${isSelected
                        ? 'bg-primary/5 border-primary shadow-sm'
                        : 'bg-white dark:bg-white/2 border-gray-100 dark:border-white/5'
                        }`}
                    >
                      <div className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-white' : 'border-gray-200 dark:border-white/10'}`}>
                        {isSelected && <span className="material-symbols-outlined text-xs font-black">check</span>}
                      </div>
                      <div className="flex-1">
                        <p className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>{s.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">R$ {s.currentPrice.toFixed(2).replace('.', ',')}</p>
                      </div>
                    </button>

                    {/* Extras if service selected */}
                    {isSelected && s.extras?.length > 0 && (
                      <div className="ml-10 space-y-2">
                        {s.extras.map((e: any) => {
                          const isExtraSelected = selectedExtras.some(ex => ex.id === e.id);
                          return (
                            <button
                              key={e.id}
                              onClick={() => toggleExtra(e)}
                              className={`w-full p-3 rounded-xl border transition-all flex items-center gap-3 text-left ${isExtraSelected
                                ? 'bg-primary/5 border-primary/30'
                                : 'bg-gray-50 dark:bg-white/2 border-gray-100 dark:border-white/5'
                                }`}
                            >
                              <div className={`size-5 rounded-md border flex items-center justify-center transition-all ${isExtraSelected ? 'bg-primary border-primary text-white' : 'border-gray-200 dark:border-white/10'}`}>
                                {isExtraSelected && <span className="material-symbols-outlined text-[10px] font-black">check</span>}
                              </div>
                              <div className="flex-1">
                                <p className={`font-bold text-xs ${isExtraSelected ? 'text-primary' : 'text-slate-700 dark:text-gray-300'}`}>{e.name}</p>
                                <p className="text-[10px] text-gray-400">R$ {e.price.toFixed(2).replace('.', ',')}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        <footer className="p-6 bg-gray-50 dark:bg-white/2 border-t border-gray-100 dark:border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Total Geral</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
                {manualPrice !== '' && <span className="text-[10px] text-primary font-bold">(Manual)</span>}
              </div>
            </div>
            <div className="w-32">
              <label className="text-[9px] text-gray-400 font-bold uppercase block text-right">Ajustar Valor</label>
              <input
                type="number"
                step="0.01"
                placeholder="R$"
                value={manualPrice}
                onChange={e => setManualPrice(e.target.value)}
                className="w-full bg-white dark:bg-background-dark p-2 rounded-xl border border-gray-200 dark:border-white/10 text-right text-xs font-bold text-primary"
              />
            </div>
          </div>

          <button
            onClick={() => onSave({
              customerName,
              categoryId: selectedCategoryId,
              services: selectedServices,
              extras: selectedExtras,
              totalPrice: finalTotal
            })}
            disabled={selectedServices.length === 0}
            className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-xl shadow-primary/20 disabled:opacity-50 disabled:grayscale transition-all active:scale-[0.98]"
          >
            Finalizar Venda
          </button>
        </footer>
      </div>
    </div>
  );
};


const AdminDashboard: React.FC<{
  appointments: Appointment[];
  onLogout: () => void;
  onOpenChat: () => void;
  onManageServices: () => void;
  onBlockSchedule: () => void;
  onSettings: () => void;
  onWeeklySchedule: () => void;
  onFinance: () => void;
  onQuotes: () => void;
  onWalkIn: () => void;
  onTV: () => void;
  onRefresh: () => void;
  onClients: () => void;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  unreadCount: number;
  unreadQuotesCount: number;
}> = ({ appointments, onLogout, onOpenChat, onManageServices, onBlockSchedule, onSettings, onWeeklySchedule, onFinance, onQuotes, onWalkIn, onTV, onRefresh, onClients, setAppointments, unreadCount, unreadQuotesCount }) => {
  const availableDays = useMemo(() => getNextDays(7), []);
  const [selectedDateStr, setSelectedDateStr] = useState(availableDays[0].dateStr); // Default to local today string
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Load WorkHours to pass to calendar if needed for disabled slots visual
  const [workHours, setWorkHours] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('work_hours').select('*').then(({ data }) => { if (data) setWorkHours(data) });
  }, []);

  console.log('AdminDashboard Render:', {
    totalAppointments: appointments.length,
    selectedDateStr,
    appsForDay: appointments.filter(a => a.date === selectedDateStr).length
  });

  const selectedDayApps = appointments.filter(a => a.date === selectedDateStr);

  // Separate Pending (Normal) from Completed
  const pendingApps = selectedDayApps.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED');

  const totalRevenue = appointments.reduce((sum, app) => sum + app.totalPrice, 0);

  const stats = useMemo(() => {
    const count = pendingApps.length;
    const revenue = selectedDayApps
      .filter(app => app.status !== 'CANCELLED')
      .reduce((sum, app) => sum + app.totalPrice, 0);
    return { count, revenue };
  }, [selectedDayApps, pendingApps]);

  const handleUpdateStatus = (id: string, status: string) => {
    // Optimistic Update
    setAppointments(prev => prev.map(app =>
      app.id === id ? { ...app, status } : app
    ));
    setActiveMenuId(null);

    supabase.from('appointments').update({ status }).eq('id', id)
      .then(({ error }) => {
        if (error) {
          console.error(error);
          onRefresh(); // Revert if error (simple way)
        }
      });
  };

  const handleDeleteAppointment = (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja cancelar o agendamento de ${name}? O horário ficará disponível novamente.`)) return;

    supabase.from('appointments').delete().eq('id', id)
      .then(({ error }) => {
        if (error) alert('Erro ao cancelar');
        else onRefresh();
      });
  };

  const subscribeUser = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!publicVapidKey) { alert('VAPID Key missing'); return; }

        const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

        // Send subscription to server (Supabase)
        // Check duplication (naive) or just insert
        await supabase.from('push_subscriptions').insert({ subscription });
        alert('Notificações em segundo plano ativadas!');
      } catch (err) {
        console.error('Subscription failed', err);
        alert('Erro ao ativar notificações. Verifique se o navegador tem permissão.');
      }
    } else {
      alert('Navegador não suportado.');
    }
  };

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/90 dark:bg-background-dark/90 flex items-center justify-between backdrop-blur-md transition-colors">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm flex items-center justify-center p-1">
            <img src={localStorage.getItem('profile_image') || "/renan.png"} alt="Admin" className="h-full w-full object-cover rounded-full" />
          </div>
          <div>
            <h2 className="font-bold leading-none text-slate-900 dark:text-white">Agenda</h2>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{localStorage.getItem('profile_name') || "Renan Sandes"}</span>
          </div>
        </div>
        <button onClick={onLogout} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 transition-colors">
          <span className="material-symbols-outlined">logout</span>
        </button>
      </header>
      <main className="p-4 pb-24 max-w-md mx-auto w-full">
        {/* Actions Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={onClients}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            <div className="size-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <span className="material-symbols-outlined filled">group</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Clientes</h3>
              <p className="text-orange-500 text-[10px] font-bold uppercase tracking-widest">Gerenciar</p>
            </div>
          </button>

          <button
            onClick={onQuotes}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            {unreadQuotesCount > 0 && (
              <div className="absolute top-3 right-3 size-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm animate-bounce-custom">
                {unreadQuotesCount}
              </div>
            )}
            <div className="size-10 rounded-xl bg-violet-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
              <span className="material-symbols-outlined filled">description</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Orçamentos</h3>
              <p className="text-violet-500 text-[10px] font-bold uppercase tracking-widest">Personalizados</p>
            </div>
          </button>

          <button
            onClick={onWalkIn}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            <div className="size-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <span className="material-symbols-outlined filled">store</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Venda Local</h3>
              <p className="text-blue-500 text-[10px] font-bold uppercase tracking-widest">Sem Agendamento</p>
            </div>
          </button>

          <button
            onClick={onManageServices}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            <div className="size-10 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <span className="material-symbols-outlined filled">content_cut</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Serviços</h3>
              <p className="text-gray-500 dark:text-white/70 text-[10px] font-bold uppercase tracking-widest">Editar/Add</p>
            </div>
          </button>

          <button
            onClick={onOpenChat}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            {unreadCount > 0 && (
              <div className="absolute top-3 right-3 size-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm animate-bounce-custom">
                {unreadCount}
              </div>
            )}
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined filled">chat</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Chat</h3>
              <p className="text-gray-500 dark:text-white/70 text-[10px] font-bold uppercase tracking-widest">Conversas</p>
            </div>
          </button>

          <button
            onClick={onFinance}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            <div className="size-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <span className="material-symbols-outlined filled">payments</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Financeiro</h3>
              <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">Relatórios</p>
            </div>
          </button>

          <button
            onClick={onBlockSchedule}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            <div className="size-10 rounded-xl bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
              <span className="material-symbols-outlined filled">event_busy</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Bloquear</h3>
              <p className="text-gray-500 dark:text-white/70 text-[10px] font-bold uppercase tracking-widest">Fechar Horários</p>
            </div>
          </button>

          <button
            onClick={onWeeklySchedule}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            <div className="size-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <span className="material-symbols-outlined filled">calendar_clock</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Horários</h3>
              <p className="text-gray-500 dark:text-white/70 text-[10px] font-bold uppercase tracking-widest">Configurar Semana</p>
            </div>
          </button>

          <button
            onClick={subscribeUser}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            <div className="size-10 rounded-xl bg-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <span className="material-symbols-outlined filled">notifications_active</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Alertas</h3>
              <p className="text-cyan-500 dark:text-cyan-400 text-[10px] font-bold uppercase tracking-widest">Ativar Push</p>
            </div>
          </button>

          <button
            onClick={onSettings}
            className="relative group flex flex-col p-4 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-white/5 hover:border-primary/30 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between"
          >
            <div className="size-10 rounded-xl bg-slate-700 flex items-center justify-center text-white shadow-lg shadow-slate-700/20">
              <span className="material-symbols-outlined filled">settings</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 dark:text-white">Configurações</h3>
              <p className="text-gray-500 dark:text-white/70 text-[10px] font-bold uppercase tracking-widest">Perfil e App</p>
            </div>
          </button>

          <button
            onClick={onTV}
            className="relative group flex flex-col p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-primary/50 active:scale-[0.98] transition-all overflow-hidden shadow-lg h-32 justify-between col-span-2"
          >
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <span className="material-symbols-outlined text-6xl text-white">tv</span>
            </div>
            <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center text-white shadow-lg backdrop-blur-sm z-10">
              <span className="material-symbols-outlined filled">desktop_windows</span>
            </div>
            <div className="text-left z-10">
              <h3 className="font-bold text-white text-lg">Modo TV (Painel)</h3>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Visualizar Agendamentos na TV</p>
            </div>
          </button>
        </div>

        {/* View Toggle & Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const current = parseISO(selectedDateStr);
                  setSelectedDateStr(format(addDays(current, -1), 'yyyy-MM-dd'));
                }}
                className="size-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>

              <div className="relative group">
                <div
                  className="flex flex-col items-center cursor-pointer select-none"
                  onClick={() => dateInputRef.current?.showPicker()}
                >
                  <h3 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                    Visão Geral
                    <span className="material-symbols-outlined text-gray-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">edit_calendar</span>
                  </h3>
                  <p className="text-gray-500 text-xs">{selectedDateStr === new Date().toISOString().split('T')[0] ? 'Hoje' : formatDateToBRL(selectedDateStr)}</p>
                </div>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={selectedDateStr}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDateStr(e.target.value);
                  }}
                  className="absolute inset-0 opacity-0 pointer-events-none"
                  style={{ visibility: 'hidden', position: 'absolute', bottom: 0, left: '50%' }}
                />
              </div>

              <button
                onClick={() => {
                  const current = parseISO(selectedDateStr);
                  setSelectedDateStr(format(addDays(current, 1), 'yyyy-MM-dd'));
                }}
                className="size-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>

            <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-full">
              <button onClick={() => setViewMode('LIST')} className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'LIST' ? 'bg-white dark:bg-surface-dark shadow text-slate-900 dark:text-white' : 'text-gray-400'}`}>
                <span className="material-symbols-outlined text-base">list</span>
              </button>
              <button onClick={() => setViewMode('CALENDAR')} className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'CALENDAR' ? 'bg-white dark:bg-surface-dark shadow text-slate-900 dark:text-white' : 'text-gray-400'}`}>
                <span className="material-symbols-outlined text-base">calendar_view_day</span>
              </button>
            </div>
          </div>
        </div>

        {
          viewMode === 'CALENDAR' ? (
            <div className="animate-fade-in relative z-0">
              <AdminCalendarView
                appointments={appointments}
                selectedDateStr={selectedDateStr}
                onDateChange={setSelectedDateStr}
                workHours={workHours}
                onAppointmentClick={(app) => setActiveMenuId(app.id)}
              />
              {activeMenuId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setActiveMenuId(null)}>
                  <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-scale-up border border-white/10" onClick={e => e.stopPropagation()}>
                    <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Ações do Agendamento</h3>
                    <div className="space-y-3">
                      <button onClick={() => handleUpdateStatus(activeMenuId, 'CONFIRMED')} className="w-full p-4 bg-blue-500/10 text-blue-600 rounded-xl font-bold flex items-center gap-3 hover:bg-blue-500/20"><span className="material-symbols-outlined">check</span> Confirmar</button>
                      <button onClick={() => handleUpdateStatus(activeMenuId, 'COMPLETED')} className="w-full p-4 bg-green-500/10 text-green-600 rounded-xl font-bold flex items-center gap-3 hover:bg-green-500/20"><span className="material-symbols-outlined">done_all</span> Concluir</button>
                      <button onClick={() => {
                        const app = appointments.find(a => a.id === activeMenuId);
                        if (app) handleDeleteAppointment(app.id, app.customerName);
                        setActiveMenuId(null);
                      }} className="w-full p-4 bg-red-500/10 text-red-600 rounded-xl font-bold flex items-center gap-3 hover:bg-red-500/20"><span className="material-symbols-outlined">delete</span> Cancelar</button>
                    </div>
                    <button onClick={() => setActiveMenuId(null)} className="w-full py-4 mt-2 text-gray-500 font-bold">Fechar</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>

              {/* Date Selector */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 pb-1">
                {availableDays.map(d => (
                  <button
                    key={d.dateStr}
                    onClick={() => setSelectedDateStr(d.dateStr)}
                    className={`p-3 rounded-xl min-w-[70px] text-center flex flex-col transition-all border ${selectedDateStr === d.dateStr
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                      : 'bg-white dark:bg-surface-dark text-gray-500 border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10'
                      }`}
                  >
                    <span className={`text-[10px] uppercase font-bold mb-1 ${selectedDateStr === d.dateStr ? 'opacity-90' : 'opacity-60'}`}>
                      {d.isToday ? 'Hoje' : d.label}
                    </span>
                    <span className={`text-xl font-bold ${selectedDateStr === d.dateStr ? 'text-white' : 'text-slate-900 dark:text-gray-300'}`}>{d.dayNum}</span>
                  </button>
                ))}
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-white dark:bg-surface-dark p-5 rounded-3xl border border-gray-200 dark:border-white/5 text-center shadow-sm transition-colors">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">{stats.count}</span>
                  <p className="text-[10px] text-gray-500 uppercase font-bold mt-2 tracking-widest">Agendados</p>
                </div>
                <div className="bg-white dark:bg-surface-dark p-5 rounded-3xl border border-gray-200 dark:border-white/5 text-center shadow-sm transition-colors">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">R$ {stats.revenue.toFixed(0)}</span>
                  <p className="text-[10px] text-gray-500 uppercase font-bold mt-2 tracking-widest">Previsão de Faturamento do dia</p>
                </div>
              </div>

              <h3 className="text-[11px] text-gray-500 font-bold uppercase mb-5 tracking-widest px-1 flex justify-between items-center">
                <span>Cronograma</span>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full normal-case text-[10px]">{pendingApps.length} agendamentos</span>
              </h3>

              {/* Appointment List */}
              <div className="space-y-4">
                {pendingApps.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-surface-dark/40 rounded-3xl border border-gray-200 dark:border-white/5 border-dashed transition-colors">
                    <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-700 mb-2">event_busy</span>
                    <p className="text-gray-500 text-sm">Sem compromissos pendentes.</p>
                  </div>
                ) : (
                  pendingApps.map((app) => (
                    <div key={app.id} className="group relative bg-white dark:bg-surface-dark p-5 rounded-3xl border-l-4 border-primary border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 transition-all shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex flex-col">
                          <span className="font-black text-xl text-slate-900 dark:text-white tracking-tight">
                            {app.time}
                          </span>
                          <span className="text-gray-500 text-[10px] font-bold uppercase mt-0.5">
                            {(() => {
                              const baseDuration = app.services.reduce((total, s) => total + s.duration, 0);
                              const allExtras = Object.values(app.selectedExtras || {}).flat();
                              const extrasDuration = (allExtras as any[]).reduce((total: number, e: any) => total + (e.duration || 0), 0);
                              return (
                                <>
                                  {formatDuration(baseDuration)}
                                  {extrasDuration > 0 && <span className="text-primary ml-1">+ {formatDuration(extrasDuration)}</span>}
                                  {" "}de duração
                                </>
                              );
                            })()}
                          </span>
                        </div>
                        <span className="bg-green-500/15 text-green-600 dark:text-green-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-green-500/20">
                          {app.status === 'CONFIRMED' ? 'Confirmado' : app.status}
                        </span>
                      </div>
                      <div className="flex gap-4 items-center">
                        <div className="size-12 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/5 flex items-center justify-center overflow-hidden shadow-inner transition-colors">
                          <span className="material-symbols-outlined text-gray-600 text-2xl">person</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-base text-slate-900 dark:text-white truncate">{app.customerName}</h4>
                          <div className="flex flex-wrap items-center gap-2">
                            {app.categoryName && (
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                                {app.categoryName}
                              </span>
                            )}
                            <p className="text-xs text-gray-500 font-medium truncate opacity-80">
                              {app.services.map(s => s.name).join(' + ')}
                              {(() => {
                                const extras = Object.values(app.selectedExtras || {}).flat();
                                return extras.length > 0 && (
                                  <span className="text-primary font-bold">
                                    {" + "}{extras.map((e: any) => e.name).join(' + ')}
                                  </span>
                                );
                              })()}
                            </p>
                          </div>
                        </div>

                        {/* <div className="relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === app.id ? null : app.id)}
                      className="size-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors"
                    >
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    {activeMenuId === app.id && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-gray-100 dark:border-white/5 z-10 overflow-hidden animate-fade-in">
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'COMPLETED')}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 text-sm font-medium text-green-600"
                        >
                          <span className="material-symbols-outlined text-lg">check_circle</span> Concluir
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'CANCELLED')}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 text-sm font-medium text-red-500"
                        >
                          <span className="material-symbols-outlined text-lg">cancel</span> Cancelar
                        </button>
                      </div>
                    )}
                  </div> */}
                      </div>

                      {/* Action Buttons Row */}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                        <a
                          href={`https://wa.me/55${app.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`*Essa mensagem é pra lembrar do seu agendamento!*

*Data:* ${app.date.split('-').reverse().join('/')}
*Horário:* ${app.time}
*Serviço:* ${app.services.map(s => s.name).join(', ')}
*Valor:* R$ ${app.totalPrice.toFixed(2).replace('.', ',')}
*Cliente:* ${app.customerName}

Dúvidas, responder a essa mensagem!`)}`}
                          target="_blank"
                          className="flex-1 h-10 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-500 flex items-center justify-center gap-1.5 transition-colors text-xs font-bold uppercase tracking-wide border border-green-500/20"
                        >
                          <span className="material-symbols-outlined text-lg">chat</span>
                          WhatsApp
                        </a>
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'COMPLETED')}
                          className="flex-1 h-10 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center gap-1.5 transition-colors text-xs font-bold uppercase tracking-wide border border-primary/20"
                        >
                          <span className="material-symbols-outlined text-lg">check_circle</span>
                          Concluir
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Tem certeza que deseja cancelar?')) handleUpdateStatus(app.id, 'CANCELLED');
                          }}
                          className="size-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors border border-red-500/20"
                          title="Cancelar Agendamento"
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Completed Section */}
              <div className="mt-8 space-y-4 opacity-70">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500">task_alt</span>
                  Concluídos Hoje ({selectedDayApps.filter(a => a.status === 'COMPLETED').length})
                </h3>
                <div className="space-y-3">
                  {selectedDayApps.filter(a => a.status === 'COMPLETED').map(app => (
                    <div key={app.id} className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-transparent flex justify-between items-center group grayscale hover:grayscale-0 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center font-bold">
                          {app.customerName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white strike-through decoration-slate-900/30">{app.customerName}</p>
                          <p className="text-xs text-gray-500">
                            {app.services.map(s => s.name).join(', ')}
                            {(() => {
                              const extras = Object.values(app.selectedExtras || {}).flat();
                              return extras.length > 0 && (
                                <span className="text-primary font-bold">
                                  {" + "}{extras.map((e: any) => e.name).join(', ')}
                                </span>
                              );
                            })()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white">{app.time}</p>
                        <p className="text-xs text-green-500 font-bold">Concluído</p>
                      </div>
                    </div>
                  ))}
                  {selectedDayApps.filter(a => a.status === 'COMPLETED').length === 0 && (
                    <p className="text-sm text-gray-400 italic">Nenhum atendimento concluído hoje.</p>
                  )}
                </div>
              </div>
            </>
          )
        }
      </main >
    </div >
  );
};

// --- Admin Services Screen ---
const AdminServicesScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingService, setEditingService] = useState<Partial<Service>>({});
  const [durationParts, setDurationParts] = useState({ days: 0, hours: 0, mins: 0 });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);

  const fetchServices = async () => {
    const { data: cats } = await supabase.from('vehicle_categories').select('*').order('display_order', { ascending: true });
    if (cats) setCategories(cats);

    const { data: servicesData, error } = await supabase
      .from('services')
      .select('*, service_prices(*)')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    const { data: extrasData } = await supabase.from('service_extras').select('*');

    if (error) console.error(error);
    else if (servicesData) {
      setServices(servicesData.map((s: any) => ({
        ...s,
        id: String(s.id),
        imageUrl: s.image_url,
        prices: s.service_prices || [],
        extras: extrasData?.filter((e: any) => String(e.service_id) === String(s.id)) || []
      })));
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const [newExtra, setNewExtra] = useState({ name: '', price: 0, duration: 0 });

  const handleAddExtra = async (serviceId: string) => {
    if (!newExtra.name) return;
    const { data, error } = await supabase.from('service_extras').insert({
      service_id: serviceId,
      name: newExtra.name,
      price: newExtra.price,
      duration: newExtra.duration
    }).select().single();

    if (error) {
      alert('Erro ao adicionar adicional');
    } else if (data) {
      setEditingService(prev => ({
        ...prev,
        extras: [...(prev.extras || []), data]
      }));
      setNewExtra({ name: '', price: 0, duration: 0 });
      fetchServices();
    }
  };

  const handleDeleteExtra = async (extraId: string) => {
    const { error } = await supabase.from('service_extras').delete().eq('id', extraId);
    if (error) {
      alert('Erro ao excluir adicional');
    } else {
      setEditingService(prev => ({
        ...prev,
        extras: prev.extras?.filter(e => e.id !== extraId) || []
      }));
      fetchServices();
    }
  };

  const handleSave = async () => {
    const totalMinutes = parseDuration(durationParts.days, durationParts.hours, durationParts.mins);

    // Check if at least one category has a price
    const hasPrices = editingService.prices && editingService.prices.length > 0 && editingService.prices.every(p => p.price > 0);

    if (!editingService.name || !hasPrices || totalMinutes <= 0) {
      if (totalMinutes <= 0) alert('A duração deve ser maior que zero');
      else if (!hasPrices) alert('Defina os preços para todas as categorias');
      return;
    }
    setLoading(true);

    const payload = {
      name: editingService.name,
      description: editingService.description,
      duration: totalMinutes,
      image_url: editingService.imageUrl,
      is_active: true
    };

    const { data: savedData, error: saveError } = editingService.id
      ? await supabase.from('services').update(payload).eq('id', editingService.id).select().single()
      : await supabase.from('services').insert(payload).select().single();

    if (saveError) {
      console.error(saveError);
      alert('Erro ao salvar serviço');
      setLoading(false);
      return;
    }

    // Save Prices
    const serviceId = savedData.id;
    const priceUpdates = editingService.prices!.map(p => ({
      service_id: serviceId,
      category_id: p.category_id,
      price: p.price
    }));

    const { error: priceError } = await supabase.from('service_prices').upsert(priceUpdates, { onConflict: 'service_id,category_id' });

    setLoading(false);
    if (priceError) {
      console.error(priceError);
      alert('Erro ao salvar preços por categoria');
    } else {
      setIsEditing(false);
      setEditingService({});
      fetchServices();
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este serviço?')) return;
    // Soft delete
    supabase.from('services').update({ is_active: false }).eq('id', id)
      .then(() => fetchServices());
  };

  if (isEditing) {
    return (
      <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col p-6 max-w-md mx-auto w-full transition-colors">
        <div className="flex items-center mb-8">
          <button onClick={() => setIsEditing(false)} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back_ios_new</span></button>
          <h2 className="text-lg font-bold flex-1 text-center pr-10 text-slate-900 dark:text-white">{editingService.id ? 'Editar Serviço' : 'Novo Serviço'}</h2>
        </div>
        <div className="space-y-4">
          <input className="w-full bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-gray-400" placeholder="Nome do Serviço" value={editingService.name || ''} onChange={e => setEditingService({ ...editingService, name: e.target.value })} />
          <textarea className="w-full bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 h-24 text-slate-900 dark:text-white placeholder:text-gray-400" placeholder="Descrição" value={editingService.description || ''} onChange={e => setEditingService({ ...editingService, description: e.target.value })} />
          <div className="space-y-4 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-sm">payments</span>
              Preços por Categoria
            </h3>
            {categories.map(cat => {
              const currentPriceObj = editingService.prices?.find(p => String(p.category_id) === String(cat.id));
              const currentPrice = currentPriceObj?.price || 0;

              return (
                <div key={cat.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-gray-300">{cat.name}</span>
                  </div>
                  <div className="w-32 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">R$</span>
                    <input
                      type="number"
                      className="w-full bg-white dark:bg-surface-dark py-2.5 pl-9 pr-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-bold text-slate-900 dark:text-white"
                      placeholder="0.00"
                      value={currentPrice || ''}
                      onChange={e => {
                        const newPrice = parseFloat(e.target.value) || 0;
                        const otherPrices = editingService.prices?.filter(p => String(p.category_id) !== String(cat.id)) || [];
                        setEditingService({
                          ...editingService,
                          prices: [...otherPrices, { category_id: Number(cat.id), price: newPrice }]
                        });
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-bold ml-1">Duração do Serviço</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input type="number" className="w-full bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white text-center" placeholder="Dias" value={durationParts.days || ''} onChange={e => setDurationParts({ ...durationParts, days: parseInt(e.target.value) || 0 })} />
                <span className="text-[10px] text-gray-400 block text-center mt-1">Dias</span>
              </div>
              <div className="flex-1">
                <input type="number" className="w-full bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white text-center" placeholder="Hrs" value={durationParts.hours || ''} onChange={e => setDurationParts({ ...durationParts, hours: parseInt(e.target.value) || 0 })} />
                <span className="text-[10px] text-gray-400 block text-center mt-1">Horas</span>
              </div>
              <div className="flex-1">
                <input type="number" className="w-full bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white text-center" placeholder="Min" value={durationParts.mins || ''} onChange={e => setDurationParts({ ...durationParts, mins: parseInt(e.target.value) || 0 })} />
                <span className="text-[10px] text-gray-400 block text-center mt-1">Minutos</span>
              </div>
            </div>
          </div>
          <input className="w-full bg-white dark:bg-surface-dark p-3 rounded-lg border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-gray-400" placeholder="URL da Imagem" value={editingService.imageUrl || ''} onChange={e => setEditingService({ ...editingService, imageUrl: e.target.value })} />

          {/* Service Extras Section */}
          {editingService.id && (
            <div className="mt-8 border-t border-gray-100 dark:border-white/5 pt-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_circle</span>
                Adicionais deste Serviço
              </h3>

              <div className="space-y-3 mb-6">
                {editingService.extras?.map(extra => (
                  <div key={extra.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-transparent">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{extra.name}</p>
                      <p className="text-[10px] text-gray-500">R$ {extra.price.toFixed(2)} • {formatDuration(extra.duration)}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteExtra(extra.id)}
                      className="size-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                ))}
                {(!editingService.extras || editingService.extras.length === 0) && (
                  <p className="text-xs text-gray-400 italic text-center py-2">Nenhum adicional cadastrado.</p>
                )}
              </div>

              {/* Add New Extra Form */}
              <div className="bg-primary/5 dark:bg-white/5 p-4 rounded-2xl border border-primary/10 space-y-3">
                <p className="text-xs font-bold text-primary dark:text-primary-dark ml-1">Adicionar novo extra</p>
                <input
                  className="w-full bg-white dark:bg-surface-dark p-2.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm"
                  placeholder="Nome do Adicional"
                  value={newExtra.name}
                  onChange={e => setNewExtra({ ...newExtra, name: e.target.value })}
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      className="w-full bg-white dark:bg-surface-dark p-2.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-center"
                      placeholder="Preço R$"
                      value={newExtra.price || ''}
                      onChange={e => setNewExtra({ ...newExtra, price: parseFloat(e.target.value) || 0 })}
                    />
                    <span className="text-[10px] text-gray-400 block text-center mt-1">Preço Extra</span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      className="w-full bg-white dark:bg-surface-dark p-2.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-center"
                      placeholder="Min"
                      value={newExtra.duration || ''}
                      onChange={e => setNewExtra({ ...newExtra, duration: parseInt(e.target.value) || 0 })}
                    />
                    <span className="text-[10px] text-gray-400 block text-center mt-1">Tempo</span>
                  </div>
                </div>
                <button
                  onClick={() => handleAddExtra(editingService.id!)}
                  disabled={!newExtra.name}
                  className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-bold shadow-md disabled:opacity-50"
                >
                  Confirmar Adicional
                </button>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-100 dark:border-white/5">
            <button onClick={handleSave} disabled={loading} className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20">
              {loading ? 'Salvando...' : 'Salvar Serviço'}
            </button>
          </div>
        </div>
      </div>
    );
  }


  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items: Service[] = Array.from(services);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setServices(items);

    // Prepare updates
    const updates = items.map((item, index) => ({
      id: item.id,
      name: item.name, // Required for upsert if not minimal, actually update allows partial
      display_order: index
    }));

    // Batch update via Promise.all is safest for now, or use upsert if we change strategy.
    // Supabase JS doesn't support bulk update with different values easily in one query without upsert/json trick.
    // For specific rows updates, we can just iterate.

    // Ideally use an RPC for this, but simplistic client-side loop is fine for small list ( < 20 services)
    for (let i = 0; i < updates.length; i++) {
      await supabase.from('services').update({ display_order: updates[i].display_order }).eq('id', updates[i].id);
    }
  };

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-50 p-4 border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 flex items-center justify-between backdrop-blur-md transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="font-bold text-slate-900 dark:text-white">Gerenciar Serviços</h2>
        <div className="size-10"></div>
      </header>
      <main className="p-4 space-y-4 max-w-md mx-auto w-full pb-24">

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="services-list">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {services.map((s, index) => (
                  // @ts-expect-error Link for known react-beautiful-dnd types issue with React 18
                  <Draggable key={s.id} draggableId={String(s.id)} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-white/5 flex gap-4 items-center transition-colors shadow-sm"
                      >
                        <div {...provided.dragHandleProps} className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-2 mr-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M360-160q-33 0-56.5-23.5T280-240q0-33 23.5-56.5T360-320q33 0 56.5 23.5T440-240q0 33-23.5 56.5T360-160Zm240 0q-33 0-56.5-23.5T520-240q0-33 23.5-56.5T600-320q33 0 56.5 23.5T680-240q0 33-23.5 56.5T600-160ZM360-400q-33 0-56.5-23.5T280-480q0-33 23.5-56.5T360-560q33 0 56.5 23.5T440-480q0 33-23.5 56.5T360-400Zm240 0q-33 0-56.5-23.5T520-480q0-33 23.5-56.5T600-560q33 0 56.5 23.5T680-480q0 33-23.5 56.5T600-400ZM360-640q-33 0-56.5-23.5T280-720q0-33 23.5-56.5T360-800q33 0 56.5 23.5T440-720q0 33-23.5 56.5T360-640Zm240 0q-33 0-56.5-23.5T520-720q0-33 23.5-56.5T600-800q33 0 56.5 23.5T680-720q0 33-23.5 56.5T600-640Z" /></svg>
                        </div>
                        <img src={s.imageUrl} className="size-16 rounded-lg object-cover bg-gray-100 dark:bg-gray-800 pointer-events-none" />
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 dark:text-white">{s.name}</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">
                            R$ {(s.price || s.prices?.[0]?.price || 0).toFixed(2)} • {formatDuration(s.duration)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button onClick={() => {
                            setEditingService(s);
                            setIsEditing(true);
                            const d = Math.floor(s.duration / (24 * 60));
                            const h = Math.floor((s.duration % (24 * 60)) / 60);
                            const m = s.duration % 60;
                            setDurationParts({ days: d, hours: h, mins: m });
                          }} className="size-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-blue-500 dark:text-blue-400 transition-colors"><span className="material-symbols-outlined text-sm">edit</span></button>
                          <button onClick={() => handleDelete(s.id)} className="size-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-red-500 dark:text-red-400 transition-colors"><span className="material-symbols-outlined text-sm">delete</span></button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

      </main>
      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={() => { setEditingService({}); setDurationParts({ days: 0, hours: 0, mins: 0 }); setIsEditing(true); }} className="size-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center transition-transform active:scale-95">
          <span className="material-symbols-outlined text-2xl">add</span>
        </button>
      </div>
    </div>
  );
};


// --- Select Category Screen ---
const SelectCategoryScreen: React.FC<{
  categories: VehicleCategory[];
  onSelect: (categoryId: string) => void;
  onBack: () => void;
}> = ({ categories, onSelect, onBack }) => {
  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('moto')) return 'two_wheeler';
    if (n.includes('suv') || n.includes('pickup')) return 'shutter_speed';
    if (n.includes('baixo')) return 'directions_car';
    return 'directions_car';
  };

  return (
    <div className="bg-gradient-to-b from-primary/20 to-white dark:bg-background-dark min-h-screen flex flex-col transition-colors">
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-gray-200 dark:border-white/5 flex items-center p-4 transition-colors">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center pr-10 text-slate-900 dark:text-white">Escolha sua Categoria</h2>
      </header>
      <main className="flex-1 p-6 max-w-md mx-auto w-full">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold mb-3 text-slate-900 dark:text-white">Selecione seu Veículo</h1>
          <p className="text-gray-600 dark:text-gray-400">Escolha a categoria que melhor descreve seu veículo para ver os preços exatos.</p>
        </div>
        <div className="grid gap-6">
          {categories.filter(c => c.is_visible).map(cat => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className="group relative bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm hover:border-primary dark:hover:border-primary hover:shadow-xl hover:shadow-primary/10 transition-all text-left overflow-hidden active:scale-[0.98]"
            >
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{cat.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Toque para selecionar e ver os serviços</p>
                </div>
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined text-2xl">{getIcon(cat.name)}</span>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-primary/5 to-transparent skew-x-12 translate-x-16 group-hover:translate-x-8 transition-transform"></div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};


// --- Theme Logic ---

// --- Main App Logic ---

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('LANDING');
  const [currentUserRole, setCurrentUserRole] = useState<'CUSTOMER' | 'BARBER'>('CUSTOMER');

  // Notification refs
  const prevAppCountRef = useRef(0);
  const isFirstLoadRef = useRef(true);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);

  // Check for persistent login
  useEffect(() => {
    // Check local storage flag OR Supabase session
    const isAuth = localStorage.getItem('admin_auth');

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session || isAuth === 'true') {
        setCurrentUserRole('BARBER');
        // Restore last view or default to dashboard
        const lastView = localStorage.getItem('last_admin_view') as AppView;
        if (lastView && lastView.startsWith('ADMIN_')) {
          setView(lastView);
        } else {
          setView('ADMIN_DASHBOARD');
        }
      }
    };
    checkSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setCurrentUserRole('BARBER');
        setView(prev => {
          if (prev.startsWith('ADMIN_')) return prev;
          const lastView = localStorage.getItem('last_admin_view') as AppView;
          if (lastView && lastView.startsWith('ADMIN_')) return lastView;
          return 'ADMIN_DASHBOARD';
        });
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('admin_auth');
        setView('LANDING');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Request Notification Permission for Admin
  useEffect(() => {
    if (currentUserRole === 'BARBER' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [currentUserRole]);

  /* Refactored fetchServicesList to be reused */
  const fetchServicesList = async (categoryId?: string) => {
    // Fetch categories first if not available
    const { data: cats } = await supabase.from('vehicle_categories').select('*').order('display_order', { ascending: true });
    if (cats) setCategories(cats);

    let query = supabase
      .from('services')
      .select('*, service_prices(*)')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    const { data: servicesData } = await query;
    const { data: extrasData } = await supabase.from('service_extras').select('*');

    if (servicesData) {
      setServices(servicesData.map((s: any) => {
        // If categoryId is provided, get the specific price. Otherwise, provide a default or all prices.
        const categoryPrice = categoryId
          ? s.service_prices?.find((p: any) => String(p.category_id) === String(categoryId))?.price
          : s.service_prices?.[0]?.price; // Fallback to first available price

        return {
          ...s,
          id: String(s.id),
          price: categoryPrice || 0,
          imageUrl: s.image_url,
          prices: s.service_prices, // Include all prices for Admin context
          extras: extrasData?.filter((e: any) => String(e.service_id) === String(s.id)) || []
        };
      }));
    }
  };

  useEffect(() => {
    fetchServicesList();
    // Fetch profile info and save to localStorage for cross-screen sync
    supabase.from('settings').select('*').in('key', ['profile_name', 'profile_image', 'company_name', 'company_tagline', 'company_address']).then(({ data }) => {
      if (data) {
        data.forEach((r: any) => localStorage.setItem(r.key, r.value));
      }
    });

    // Fetch work hours for HomeScreen display
    supabase.from('work_hours').select('*').eq('is_open', true).then(({ data }) => {
      if (data) {
        // Group similar hours
        const groups: { [key: string]: number[] } = {};
        data.forEach((w: any) => {
          let range = '';
          if (w.is_morning_open && w.start_time_1 && w.end_time_1) {
            range += `${w.start_time_1.slice(0, 5)} - ${w.end_time_1.slice(0, 5)}`;
          }
          if (w.is_afternoon_open && w.start_time_2 && w.end_time_2) {
            if (range) range += ' e ';
            range += `${w.start_time_2.slice(0, 5)} - ${w.end_time_2.slice(0, 5)}`;
          }

          if (!range) return;
          if (!groups[range]) groups[range] = [];
          groups[range].push(w.day_of_week);
        });

        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const formatted = Object.entries(groups).map(([range, days]) => {
          days.sort((a, b) => a - b);
          if (days.length === 5 && days[0] === 1 && days[4] === 5) return `Seg - Sex: ${range}`;
          if (days.length === 6 && days[0] === 1 && days[5] === 6) return `Seg - Sáb: ${range}`;
          const label = days.map(d => dayNames[d]).join(', ');
          return `${label}: ${range}`;
        });
        localStorage.setItem('business_hours', JSON.stringify(formatted));
      }
    });
  }, []);


  const [booking, setBooking] = useState<BookingState>({
    customerName: '',
    customerPhone: '',
    selectedServices: [],
    selectedExtras: {},
    selectedDate: '',
    selectedTime: '',
  });

  const [selectedChatClient, setSelectedChatClient] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    // Fetch chat messages
    // If Admin and selectedChatClient, fetch for that client
    // If Customer, fetch by their phone (booking state) OR maybe we need a session state for customer phone?
    // For simplicity: Customer sees all messages if no phone tied (demo) or filtered by phone if known

    // Admin View Logic:
    let query = '';
    if (currentUserRole === 'BARBER' && selectedChatClient) {
      query = `?clientId=${selectedChatClient.id}`;
    } else if (currentUserRole === 'CUSTOMER' && booking.customerPhone) {
      query = `?phone=${booking.customerPhone}`;
    }

    const fetchChat = async () => {
      let query = supabase.from('chat_messages').select('*').order('sent_at', { ascending: true });
      if (currentUserRole === 'BARBER' && selectedChatClient) {
        query = query.eq('client_id', selectedChatClient.id);

        // Mark as read if Admin
        await supabase.from('chat_messages').update({ is_read: true }).eq('client_id', selectedChatClient.id).eq('sender_type', 'CUSTOMER').eq('is_read', false);

      } else if (currentUserRole === 'CUSTOMER' && booking.customerPhone) {
        // We need client ID from phone
        const { data: client } = await supabase.from('clients').select('id').eq('phone', booking.customerPhone).single();
        if (client) query = query.eq('client_id', client.id);
        else return; // user not found yet
      }

      const { data, error } = await query;
      if (data) {
        // ... mappings
        const mapped = data.map((m: any) => ({
          id: String(m.id),
          text: m.message_text,
          sender: m.sender_type,
          timestamp: new Date(m.sent_at)
        }));
        setChatMessages(mapped);
      }
    };
    fetchChat();
    const interval = setInterval(fetchChat, 3000);
    return () => clearInterval(interval);
  }, [selectedChatClient, currentUserRole, booking.customerPhone]);

  // Dynamically set today's date for mock data
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const [showSuccess, setShowSuccess] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadQuotesCount, setUnreadQuotesCount] = useState(0);
  const prevUnreadCountRef = useRef(0);
  const [notificationState, setNotificationState] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

  // Watch for unread count increase
  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current && prevUnreadCountRef.current >= 0) {
      // Trigger Notification
      setNotificationState({ visible: true, message: 'Você tem uma nova mensagem de cliente!' });
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => { });
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  const fetchAppointments = useCallback(async () => {
    let query = supabase
      .from('appointments')
      .select(`
                  *,
                  services:appointment_services(
                    service:services(*)
                  ),
                  extras:appointment_extras(*),
                  clients(name, phone),
                  vehicle_categories(name)
                  `)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    // Fetch Unread Count for Admin
    if (currentUserRole === 'BARBER') {
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .eq('sender_type', 'CUSTOMER');
      setUnreadCount(count || 0);

      const { count: quoteCount } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('status', 'COMPLETED');
      setUnreadQuotesCount(quoteCount || 0);
    }

    // Client-side filtering for customer (or do it in RLS/query filter if simple)
    // Actually we can filter by client phone join, but for now fetch all and filter is safer if we don't have perfect join filtering setup

    const { data, error } = await query;

    if (data) {
      let newApps = data.map((a: any) => ({
        id: String(a.id),
        date: a.appointment_date,
        time: a.appointment_time ? a.appointment_time.slice(0, 5) : '',
        status: a.status,
        totalPrice: a.total_price,
        customerName: a.clients?.name || 'Cliente',
        customerPhone: a.clients?.phone || '',
        categoryName: a.vehicle_categories?.name || '',
        services: a.services.map((s: any) => ({
          ...s.service,
          imageUrl: s.service.image_url
        })),
        selectedExtras: (a.extras || []).reduce((acc: any, e: any) => {
          const sId = String(e.service_id);
          if (!acc[sId]) acc[sId] = [];
          acc[sId].push(e);
          return acc;
        }, {})
      }));

      if (currentUserRole === 'CUSTOMER' && booking.customerPhone) {
        newApps = newApps.filter((app: Appointment) => app.customerPhone === booking.customerPhone);
      }

      // Check new appointments
      if (currentUserRole === 'BARBER' && !isFirstLoadRef.current) {
        if (newApps.length > prevAppCountRef.current) {
          if (Notification.permission === 'granted') {
            new Notification("Novo Agendamento!");
          }
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => { });
        }
      }

      setAppointments(newApps);
      prevAppCountRef.current = newApps.length;
      isFirstLoadRef.current = false;
    }
  }, [currentUserRole, booking.customerPhone]);

  useEffect(() => {
    fetchAppointments();

    const channel = supabase
      .channel('realtime-appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          console.log('Realtime change detected:', payload);
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => { });
          fetchAppointments();
        }
      )
      .subscribe();

    const interval = setInterval(fetchAppointments, 30000); // Poll every 30s as backup

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchAppointments]);

  const handleRegisterIdentity = (identity: { name: string, phone: string }) => {
    setBooking(prev => ({ ...prev, customerName: identity.name, customerPhone: identity.phone }));
  };

  const handleSendMessage = async (text: string, identity?: { name: string, phone: string }) => {
    if (identity) {
      setBooking(prev => ({ ...prev, customerName: identity.name, customerPhone: identity.phone }));
    }

    const phoneToSend = identity?.phone || booking.customerPhone;
    const nameToSend = identity?.name || booking.customerName;

    let cId = selectedChatClient?.id;

    // Resolve Client ID
    if (!cId) {
      // Look up by phone
      const { data: client } = await supabase.from('clients').select('id').eq('phone', phoneToSend).single();
      if (client) {
        cId = client.id;
      } else {
        // Create
        const { data: newClient } = await supabase.from('clients').insert({ name: nameToSend, phone: phoneToSend }).select().single();
        if (newClient) cId = newClient.id;
      }
    }

    if (!cId) return;

    await supabase.from('chat_messages').insert({
      client_id: cId,
      sender_type: currentUserRole,
      message_text: text,
      sent_at: new Date().toISOString()
    });

    // Re-fetch handled by polling or subscription (polling in this case)
  };

  const handleFinishBooking = async () => {
    // 1. Find or Create Client
    let clientId: number | undefined;
    const { data: clientData } = await supabase.from('clients').select('id').eq('phone', booking.customerPhone).single();
    if (clientData) {
      clientId = clientData.id;
    } else {
      const { data: newClient, error: clientError } = await supabase.from('clients').insert({ name: booking.customerName, phone: booking.customerPhone }).select().single();
      if (clientError || !newClient) { alert('Erro ao salvar cliente'); return; }
      clientId = newClient.id;
    }

    // 1.5 Check Availability and Insert Loop
    let allSuccess = true;
    for (const slot of booking.selectedSlots || []) {
      const service = booking.selectedServices.find(s => s.id === slot.serviceId);
      if (!service) continue;

      const extras = booking.selectedExtras[service.id] || [];
      const slotPrice = service.price + extras.reduce((sum, e) => sum + e.price, 0);

      const { data: dayApps } = await supabase.from('appointments').select('appointment_time').eq('appointment_date', slot.date).neq('status', 'CANCELLED');
      const { data: dayBlocks } = await supabase.from('blocked_slots').select('time').eq('date', slot.date);

      const isTaken = dayApps?.some(a => a.appointment_time?.startsWith(slot.time));
      const isBlocked = dayBlocks?.some(b => b.time?.startsWith(slot.time));

      if (isTaken || isBlocked) {
        alert(`O horário ${slot.date} às ${slot.time} para ${service.name} acabou de ser reservado ou bloqueado.Volte e escolha outro.`);
        allSuccess = false;
        break;
      }

      // 2. Create Appointment
      const { data: appData, error: appError } = await supabase.from('appointments').insert({
        client_id: clientId,
        appointment_date: slot.date,
        appointment_time: slot.time,
        total_price: slotPrice,
        status: 'PENDING',
        category_id: booking.selectedCategoryId
      }).select().single();

      if (appError || !appData) {
        alert('Erro ao agendar: ' + (appError?.message || ''));
        allSuccess = false;
        break;
      }

      // 3. Insert Service
      await supabase.from('appointment_services').insert([{
        appointment_id: appData.id,
        service_id: service.id,
        price_at_booking: service.price
      }]);

      // 4. Insert Extras
      const extraInserts = extras.map(extra => ({
        appointment_id: appData.id,
        extra_id: extra.id,
        name: extra.name,
        price: extra.price,
        duration: extra.duration
      }));

      if (extraInserts.length > 0) {
        await supabase.from('appointment_extras').insert(extraInserts);
      }
    }

    if (!allSuccess) return;

    // Success
    setShowSuccess(true);
    setBooking(prev => ({
      ...prev,
      selectedServices: [],
      selectedExtras: {},
      selectedDate: '',
      selectedTime: '',
    }));
    fetchAppointments();
    setTimeout(() => {
      setShowSuccess(false);
      setView('MY_APPOINTMENTS');
    }, 3000);
  };

  const handleSaveWalkIn = async (data: {
    customerName: string;
    categoryId: string;
    services: any[];
    extras: any[];
    totalPrice: number;
  }) => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const timeStr = format(now, 'HH:mm:ss');

    // 1. Find or create client
    let clientId: string | undefined;
    const { data: client } = await supabase.from('clients').select('id').eq('name', data.customerName).limit(1);
    if (client && client.length > 0) {
      clientId = client[0].id;
    } else {
      const { data: newClient } = await supabase.from('clients').insert({ name: data.customerName }).select().single();
      if (newClient) clientId = newClient.id;
    }

    // 2. Insert Appointment as COMPLETED
    const { data: appData, error: appError } = await supabase.from('appointments').insert({
      client_id: clientId,
      appointment_date: todayStr,
      appointment_time: timeStr,
      total_price: data.totalPrice,
      status: 'COMPLETED',
      category_id: data.categoryId
    }).select().single();

    if (appError) {
      alert('Erro ao salvar venda: ' + appError.message);
      return;
    }

    // 3. Insert Services
    if (data.services.length > 0) {
      await supabase.from('appointment_services').insert(data.services.map(s => ({
        appointment_id: appData.id,
        service_id: s.id,
        price_at_booking: s.currentPrice
      })));
    }

    // 4. Insert Extras
    if (data.extras.length > 0) {
      await supabase.from('appointment_extras').insert(data.extras.map(e => ({
        appointment_id: appData.id,
        extra_id: e.id,
        name: e.name,
        price_at_booking: e.price
      })));
    }

    setShowWalkInModal(false);
    fetchAppointments();
    alert('Venda local registrada com sucesso!');
  };

  const renderView = () => {
    switch (view) {
      case 'LANDING':
        return <LandingScreen onStart={() => setView('HOME')} onAdmin={() => setView('LOGIN')} />;
      case 'HOME':
        return <HomeScreen
          onAgendar={() => {
            fetchServicesList(); // Refresh categories and services
            setView('SELECT_CATEGORY');
          }}
          onQuote={() => setView('CUSTOM_QUOTE')}
          onChat={() => { setCurrentUserRole('CUSTOMER'); setView('CHAT'); }}
          onPerfil={() => {
            setView('CUSTOMER_LOGIN');
          }}
          onMais={() => setView('LANDING')}
          address={localStorage.getItem('company_address') || ""}
          hours={JSON.parse(localStorage.getItem('business_hours') || "[]")}
        />;
      case 'SELECT_CATEGORY':
        return <SelectCategoryScreen
          categories={categories}
          onSelect={(catId) => {
            setBooking(prev => ({ ...prev, selectedCategoryId: catId }));
            fetchServicesList(catId); // Refetch services with category prices
            setView('SELECT_SERVICES');
          }}
          onBack={() => setView('HOME')}
        />;
      case 'SELECT_SERVICES':
        return <SelectServicesScreen
          booking={booking}
          setBooking={setBooking}
          onNext={() => setView('SELECT_DATE_TIME')}
          onBack={() => setView('HOME')}
          services={services}
        />;
      case 'SELECT_DATE_TIME':
        return <SelectDateTimeScreen
          booking={booking}
          setBooking={setBooking}
          onNext={() => setView('REVIEW')}
          onBack={() => setView('SELECT_SERVICES')}
        />;
      case 'REVIEW':
        return <ReviewScreen
          booking={booking}
          onConfirm={handleFinishBooking}
          onBack={() => setView('SELECT_DATE_TIME')}
        />;
      case 'MY_APPOINTMENTS':
        return <MyAppointmentsScreen
          appointments={appointments}
          onBack={() => setView('HOME')}
          onNew={() => setView('SELECT_SERVICES')}
          onRefresh={fetchAppointments}
        />;
      case 'LOGIN':
        return <LoginScreen onLogin={() => { setCurrentUserRole('BARBER'); setView('ADMIN_DASHBOARD'); }} onBack={() => setView('LANDING')} />;
      case 'ADMIN_DASHBOARD':
        return <AdminDashboard
          appointments={appointments}
          unreadCount={unreadCount}
          unreadQuotesCount={unreadQuotesCount}
          onLogout={async () => {
            localStorage.removeItem('admin_auth');
            localStorage.removeItem('last_admin_view');
            try {
              await supabase.auth.signOut();
            } catch (err) {
              console.warn('Sign out error (ignoring):', err);
            }
            setCurrentUserRole('CUSTOMER');
            setView('LANDING');
          }}
          onOpenChat={() => { setCurrentUserRole('BARBER'); setView('ADMIN_CHAT_LIST'); }}
          onManageServices={() => setView('ADMIN_SERVICES')}
          onBlockSchedule={() => setView('ADMIN_BLOCK_SCHEDULE')}
          onSettings={() => setView('ADMIN_SETTINGS')}
          onWeeklySchedule={() => setView('ADMIN_WEEKLY_SCHEDULE')}
          onFinance={() => setView('ADMIN_FINANCE')}
          onTV={() => setView('ADMIN_TV')}
          onWalkIn={() => setShowWalkInModal(true)}

          onRefresh={fetchAppointments}
          onClients={() => setView('ADMIN_CLIENTS')}
          onQuotes={() => {
            setView('ADMIN_QUOTES');
            // Mark all quotes as read when entering the screen
            supabase.from('quotes').update({ is_read: true }).eq('is_read', false).then(() => {
              setUnreadQuotesCount(0);
            });
          }}
          setAppointments={setAppointments}
        />;
      case 'ADMIN_SERVICES':
        return <AdminServicesScreen onBack={() => setView('ADMIN_DASHBOARD')} />;
      case 'ADMIN_BLOCK_SCHEDULE':
        return <AdminBlockScheduleScreen onBack={() => setView('ADMIN_DASHBOARD')} />;
      case 'ADMIN_SETTINGS':
        return <AdminSettingsScreen onBack={() => setView('ADMIN_DASHBOARD')} />;
      case 'ADMIN_WEEKLY_SCHEDULE':
        return <AdminWeeklyScheduleScreen onBack={() => setView('ADMIN_DASHBOARD')} />;
      case 'ADMIN_FINANCE':
        return <AdminFinanceScreen onBack={() => setView('ADMIN_DASHBOARD')} />;
      case 'ADMIN_TV':
        return <AdminTVScreen appointments={appointments} onRefresh={fetchAppointments} onBack={() => setView('ADMIN_DASHBOARD')} />;
      case 'ADMIN_CHAT_LIST':
        return <AdminChatListScreen
          onBack={() => setView('ADMIN_DASHBOARD')}
          onSelectChat={(cId, cName) => {
            setSelectedChatClient({ id: cId, name: cName });
            setView('CHAT');
          }}
        />;
      case 'CHAT':
        return <ChatScreen
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          onRegister={handleRegisterIdentity}
          currentUserRole={currentUserRole}
          customerIdentity={{ name: booking.customerName, phone: booking.customerPhone }}
          chatClientId={selectedChatClient?.id}
          onBack={() => {
            if (currentUserRole === 'BARBER') setView('ADMIN_CHAT_LIST');
            else setView('HOME');
          }}
        />;
      case 'CUSTOMER_LOGIN':
        return <CustomerLoginScreen
          onLogin={(phone) => {
            setBooking(prev => ({ ...prev, customerPhone: phone }));
            setView('MY_APPOINTMENTS');
          }}
          onBack={() => setView('HOME')}
        />;
      case 'ADMIN_CLIENTS':
        return <AdminClientsScreen
          onBack={() => setView('ADMIN_DASHBOARD')}
          onChat={(cId, cName) => {
            setSelectedChatClient({ id: cId, name: cName });
            setCurrentUserRole('BARBER');
            setView('CHAT');
          }}
        />;
      case 'ADMIN_QUOTES':
        return <AdminQuotesScreen onBack={() => setView('ADMIN_DASHBOARD')} />;
      case 'CUSTOM_QUOTE':
        return <CustomQuoteScreen
          onBack={() => setView('HOME')}
          setBooking={setBooking}
          customerPhone={booking.customerPhone}
          customerName={booking.customerName}
        />;
      default:
        return <LandingScreen onStart={() => setView('HOME')} onAdmin={() => setView('LOGIN')} />;
    }
  };

  // Persist View State
  useEffect(() => {
    if (view.startsWith('ADMIN_')) {
      localStorage.setItem('last_admin_view', view);
    }
  }, [view]);

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-900 dark:text-white font-display transition-colors duration-300">
      {showSuccess && <SuccessOverlay />}
      <IOSNotification
        visible={notificationState.visible}
        message={notificationState.message}
        onClose={() => setNotificationState(prev => ({ ...prev, visible: false }))}
      />
      {renderView()}
      <AdminWalkInServiceModal
        isOpen={showWalkInModal}
        onClose={() => setShowWalkInModal(false)}
        categories={categories}
        allServices={services}
        onSave={handleSaveWalkIn}
      />
      <ReloadPrompt />
    </div>
  );
};

export default App;
