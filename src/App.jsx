import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, doc, onSnapshot, setDoc, getDoc, addDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { specialTracks, corosBiblicaTracks, verses } from './data/constants';
import './App.css'; 
import '@fortawesome/fontawesome-free/css/all.min.css'; 

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); 

export const EQUIPOS = ["Rojo", "Verde", "Azul", "Negro"];
export const colorMap = { "Rojo": "#e74c3c", "Verde": "#2ecc71", "Azul": "#38bdf8", "Negro": "#9ca3af" };

export default function App() {
    // ==========================================
    // ESTADOS GENERALES Y DEL HIMNARIO
    // ==========================================
    const [activeBook, setActiveBook] = useState('evangelio'); 
    const [activeCampModule, setActiveCampModule] = useState('dashboard'); 
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // NUEVO: Estado para menú móvil
    const [roleStep, setRoleStep] = useState('select'); 
    const [role, setRole] = useState(null); 
    const [pinInput, setPinInput] = useState('');
    const [sessionCode, setSessionCode] = useState('');
    const [screen, setScreen] = useState('welcome'); 
    const [proyectorConectado, setProyectorConectado] = useState(false); 
    
    const [allHymns, setAllHymns] = useState([]);
    const [filteredHymns, setFilteredHymns] = useState([]);
    const [rangeTitle, setRangeTitle] = useState("");
    const [currentHymn, setCurrentHymn] = useState(null);
    const [slides, setSlides] = useState([]);
    const [slideIndex, setSlideIndex] = useState(0);
    const [fontSize, setFontSize] = useState(2.5); 
    
    const [activeVideoList, setActiveVideoList] = useState([]);
    const [videoTitle, setVideoTitle] = useState("");
    const [currentVideo, setCurrentVideo] = useState(null);
    const [verseText, setVerseText] = useState("");

    // ==========================================
    // ESTADOS DEL CAMPAMENTO (VISTAS EN VIVO)
    // ==========================================
    const [campistas, setCampistas] = useState([]); 
    const [lideres, setLideres] = useState([]);
    const [evaluacionesVerso, setEvaluacionesVerso] = useState([]);
    const [evaluacionesCoro, setEvaluacionesCoro] = useState([]);
    const [mejoresCampistas, setMejoresCampistas] = useState([]);
    const [actividades, setActividades] = useState({}); 
    const [teamDetailMode, setTeamDetailMode] = useState(null); 
    const [teamVersoDetailMode, setTeamVersoDetailMode] = useState(null); 
    const [teamCoroDetailMode, setTeamCoroDetailMode] = useState(null);
    const [teamWinnerDetailMode, setTeamWinnerDetailMode] = useState(null);
    
    // ==========================================
    // ESTADOS: MÓDULO DEL LÍDER Y JUEZ
    // ==========================================
    const [liderLogueado, setLiderLogueado] = useState(null); 
    const [localCampers, setLocalCampers] = useState([]); 
    const [camperNum, setCamperNum] = useState('');
    const [camperNombre, setCamperNombre] = useState('');
    const [camperEdad, setCamperEdad] = useState('');
    const [camperFotoObj, setCamperFotoObj] = useState(null);
    const [camperFotoPreview, setCamperFotoPreview] = useState(null);
    const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
    const [verseScores, setVerseScores] = useState({});
    const [isSubmittingVerso, setIsSubmittingVerso] = useState(false);
    const [selectedBestCamper, setSelectedBestCamper] = useState(null);
    const [isSubmittingBest, setIsSubmittingBest] = useState(false);

    // Juez Coro
    const [juezNombre, setJuezNombre] = useState('');
    const [juezEquipo1, setJuezEquipo1] = useState('');
    const [juezEquipo2, setJuezEquipo2] = useState('');
    const [juezRitmo, setJuezRitmo] = useState('');
    const [juezVolumen, setJuezVolumen] = useState('');
    const [juezCoordinacion, setJuezCoordinacion] = useState('');
    const [isSubmittingJuez, setIsSubmittingJuez] = useState(false);
    const [juezSubmitted, setJuezSubmitted] = useState(false);

    // ==========================================
    // ESTADOS: PANEL DE ANFITRIÓN Y ALERTAS
    // ==========================================
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);
    const [isAdminLogged, setIsAdminLogged] = useState(false);

    const [nuevoLider, setNuevoLider] = useState({ nombre: '', equipo: '', fotoObj: null, fotoPreview: null });
    const [isSubmittingLider, setIsSubmittingLider] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [modalUrl, setModalUrl] = useState('');
    const [modalTitle, setModalTitle] = useState('');

    const [showWipeModal, setShowWipeModal] = useState(false);
    const [wipeEmail, setWipeEmail] = useState('');
    const [wipePassword, setWipePassword] = useState('');
    const [isWiping, setIsWiping] = useState(false);

    // ==========================================
    // ESTADOS: ESGRIMA, DINÁMICAS, RESCATE
    // ==========================================
    const [esgrimaPreguntasDB, setEsgrimaPreguntasDB] = useState([]);
    const [nuevaPreguntaTexto, setNuevaPreguntaTexto] = useState('');
    const [nuevaPreguntaPuntos, setNuevaPreguntaPuntos] = useState(5);
    const [isSubmittingPregunta, setIsSubmittingPregunta] = useState(false);
    const [esgrimaActividadesDB, setEsgrimaActividadesDB] = useState({});
    const [actsLocal, setActsLocal] = useState({ 1: { ganador: '', contesto: null, rebote: '' }, 2: { ganador: '', contesto: null, rebote: '' }, 3: { ganador: '', contesto: null, rebote: '' } });
    const [respuestasEsgrima, setRespuestasEsgrima] = useState({});
    const [esgrimaResultadosDB, setEsgrimaResultadosDB] = useState({});
    const [isSubmittingEsgrima, setIsSubmittingEsgrima] = useState(false);

    const [dinamicasDB, setDinamicasDB] = useState([]);
    const [dinamicasResultados, setDinamicasResultados] = useState([]);
    const [nuevaDinamica, setNuevaDinamica] = useState({ nombre: '', detalles: '', puntos: 10, ganadoresValidos: '1' });
    const [isSubmittingDinamica, setIsSubmittingDinamica] = useState(false);
    const [dinamicasGanadoresLocal, setDinamicasGanadoresLocal] = useState({});

    const [rescateDB, setRescateDB] = useState([]);
    const [rescateResultados, setRescateResultados] = useState([]);
    const [nuevoRescateTexto, setNuevoRescateTexto] = useState('');
    const [nuevoRescatePuntos, setNuevoRescatePuntos] = useState(4);
    const [isSubmittingRescate, setIsSubmittingRescate] = useState(false);
    const [actsRescateLocal, setActsRescateLocal] = useState({});

    // ==========================================
    // ESTADOS: LIGA SUBASTA
    // ==========================================
    const [subastaLotesDB, setSubastaLotesDB] = useState([]);
    const [subastaResultadosDB, setSubastaResultadosDB] = useState([]);
    
    // Creador de Lotes
    const [nuevoLote, setNuevoLote] = useState({ numero: '', nombre: '', detalle: '', base: 100, premioPV: 150, riesgo: 'Fácil', tiempoSecs: 0, fotoObj: null, fotoPreview: null });
    const [isSubmittingLote, setIsSubmittingLote] = useState(false);
    
    // Ejecución de Subasta
    const [subastaActiveLot, setSubastaActiveLot] = useState(null); 
    const [subastaEjecucion, setSubastaEjecucion] = useState({ comprador: '', cumplio: null, rebote: '', cumplioRebote: null });
    
    // Banco Final
    const [sobrantesBanco, setSobrantesBanco] = useState({ "Rojo": '', "Verde": '', "Azul": '', "Negro": '' });
    const [isSubmittingBanco, setIsSubmittingBanco] = useState(false);

    // Estado del Cronómetro Proyector
    const [timerRemaining, setTimerRemaining] = useState(null);
    const tickAudioRef = useRef(null);
    const alarmAudioRef = useRef(null);

    // CÁMARA Y ALERTAS
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [toastMsg, setToastMsg] = useState('');

    const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3500); };
    const openLinkModal = (url, title) => { setModalUrl(url); setModalTitle(title); setShowLinkModal(true); };

   // ==========================================
    // INICIO: DETECCIÓN DE URL Y RECUPERACIÓN DE SESIÓN
    // ==========================================
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const savedSession = localStorage.getItem('hymnSession');

        if (params.get('modo') === 'lider') { 
            setRole('lider'); setRoleStep('ready'); setScreen('lider-login'); 
        } else if (params.get('modo') === 'juez') { 
            setRole('juez'); setRoleStep('ready'); setScreen('juez-coro'); 
        } else if (savedSession) {
            // Restaurar la sesión si se recargó la página accidentalmente
            try {
                const { code, savedRole } = JSON.parse(savedSession);
                if (code && savedRole) {
                    setSessionCode(code);
                    setRole(savedRole);
                    setRoleStep('ready');
                    setScreen('welcome');
                }
            } catch (e) {
                console.error("Error al restaurar sesión:", e);
            }
        }
    }, []);

    // ==========================================
    // 1. AUTENTICACIÓN Y CARGA DE DATOS (HIMNOS)
    // ==========================================
    useEffect(() => {
        const fetchHymns = async () => {
            const cachedHymns = localStorage.getItem('hymnosCache');
            if (cachedHymns) {
                // ESCUDO 1: Previene que un caché corrupto rompa la app
                try {
                    setAllHymns(JSON.parse(cachedHymns));
                } catch (e) {
                    console.error("Caché corrupto, limpiando...");
                    localStorage.removeItem('hymnosCache');
                }
            }
            try {
                const q = query(collection(db, "himnos"), orderBy("numero"));
                const snapshot = await getDocs(q);
                const hymnsData = snapshot.docs.map(doc => ({ id_doc: doc.id, ...doc.data() }));
                setAllHymns(hymnsData); 
                localStorage.setItem('hymnosCache', JSON.stringify(hymnsData)); 
            } catch (error) { console.error("Error al cargar himnos:", error); }
        };
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => { if (user) fetchHymns(); else signInAnonymously(auth).catch(console.error); });
        return () => unsubscribeAuth();
    }, []);

 // ==========================================
    // 2. ESCUCHADORES EN VIVO MÚLTIPLES (OPTIMIZADOS)
    // ==========================================
    useEffect(() => {
        let unsubscribers = [];

        // ESCUDO 2: Retrasamos medio segundo la conexión masiva a Firebase
        // para no colapsar el procesador de los celulares al recargar.
        const iniciarConexion = setTimeout(() => {
            unsubscribers.push(onSnapshot(collection(db, "campistas"), (s) => setCampistas(s.docs.map(d => ({ id: d.id, ...d.data() })))));
            unsubscribers.push(onSnapshot(collection(db, "lideres"), (s) => setLideres(s.docs.map(d => ({ id: d.id, ...d.data() })))));
            unsubscribers.push(onSnapshot(collection(db, "eval_verso"), (s) => setEvaluacionesVerso(s.docs.map(d => ({ id: d.id, ...d.data() })))));
            unsubscribers.push(onSnapshot(collection(db, "eval_coro"), (s) => setEvaluacionesCoro(s.docs.map(d => ({ id: d.id, ...d.data() })))));
            unsubscribers.push(onSnapshot(collection(db, "mejores_campistas"), (s) => setMejoresCampistas(s.docs.map(d => ({ id: d.id, ...d.data() })))));
            unsubscribers.push(onSnapshot(doc(db, "campamento", "actividades"), (d) => { if (d.exists()) setActividades(d.data()); }));
            unsubscribers.push(onSnapshot(query(collection(db, "esgrima_preguntas"), orderBy("timestamp")), (s) => setEsgrimaPreguntasDB(s.docs.map(d => ({ id: d.id, ...d.data() })))));
            unsubscribers.push(onSnapshot(collection(db, "esgrima_actividades"), (s) => { let acts = {}; s.docs.forEach(d => acts[d.id] = d.data()); setEsgrimaActividadesDB(acts); }));
            unsubscribers.push(onSnapshot(doc(db, "esgrima_resultados", "totales"), (d) => { if (d.exists()) setEsgrimaResultadosDB(d.data()); }));
            unsubscribers.push(onSnapshot(query(collection(db, "dinamicas_db"), orderBy("timestamp")), (s) => setDinamicasDB(s.docs.map(d => ({ id: d.id, ...d.data() })))));
            unsubscribers.push(onSnapshot(collection(db, "dinamicas_resultados"), (s) => setDinamicasResultados(s.docs.map(d => ({ id: d.id, ...d.data() })))));
            unsubscribers.push(onSnapshot(query(collection(db, "rescate_db"), orderBy("timestamp")), (s) => setRescateDB(s.docs.map(d => ({ id: d.id, ...d.data() })))));
            unsubscribers.push(onSnapshot(collection(db, "rescate_resultados"), (s) => setRescateResultados(s.docs.map(d => ({ id: d.id, ...d.data() })))));
            unsubscribers.push(onSnapshot(query(collection(db, "subasta_lotes"), orderBy("numero")), (s) => setSubastaLotesDB(s.docs.map(d => ({ id: d.id, ...d.data() })))));
            unsubscribers.push(onSnapshot(collection(db, "subasta_resultados"), (s) => setSubastaResultadosDB(s.docs.map(d => ({ id: d.id, ...d.data() })))));
        }, 500);

        // Limpieza de memoria súper segura (Evita errores si el usuario cierra rápido la app)
        return () => {
            clearTimeout(iniciarConexion);
            unsubscribers.forEach(unsub => unsub());
        };
    }, []);

    // ==========================================
    // LÓGICA DE AGREGACIÓN: EQUIPO GANADOR
    // ==========================================
    const getTeamStats = (team) => {
        let versoPts = 0, coroPts = 0, esgrimaPts = 0, dinamicasPts = 0, rescatePts = 0, subastaPts = 0;
        let history = [];

        // 1. VERSO
        const myCampers = campistas.filter(c => c.equipo === team);
        const evalVerso = evaluacionesVerso.find(e => e.id === team);
        if (evalVerso && myCampers.length > 0) {
            let pts = 0; myCampers.forEach(c => pts += evalVerso.scores[c.id] || 0);
            versoPts = parseFloat(((pts / (myCampers.length * 10)) * 100).toFixed(1));
            history.push({ modulo: 'Eval. Verso', puntos: versoPts, detalle: 'Ponderación grupal', evaluador: 'Líder Evaluador' });
        }

        // 2. CORO
        const evalCoro = evaluacionesCoro.filter(e => e.equipos && e.equipos.includes(team));
        if (evalCoro.length > 0) {
            let sum = 0; evalCoro.forEach(e => sum += e.total);
            coroPts = parseFloat((sum / evalCoro.length / 2).toFixed(1));
            history.push({ modulo: 'Eval. Coro', puntos: coroPts, detalle: 'Promedio de jueces', evaluador: 'Jueces' });
        }

        // 3. ESGRIMA
        [1,2,3].forEach(n => {
            const a = esgrimaActividadesDB[`act${n}`];
            if(a) {
                if(a.ganadorDinámica === team) { esgrimaPts += a.puntosDinamica; history.push({modulo: 'Esgrima', puntos: a.puntosDinamica, detalle: `Ganó Dinámica ${n}`, evaluador: 'Admin'}); }
                if(a.ganadorDinámica === team && a.contestoPregunta) { esgrimaPts += a.puntosPregunta; history.push({modulo: 'Esgrima', puntos: a.puntosPregunta, detalle: `Contestó Pregunta ${n}`, evaluador: 'Admin'}); }
                if(a.equipoRebote === team) { esgrimaPts += a.puntosPregunta; history.push({modulo: 'Esgrima', puntos: a.puntosPregunta, detalle: `Rebote Pregunta ${n}`, evaluador: 'Admin'}); }
            }
        });
        esgrimaPreguntasDB.forEach(q => {
            let answerTeam = esgrimaResultadosDB.guardadoFinal ? esgrimaResultadosDB.respuestasRueda?.[q.id] : respuestasEsgrima[q.id];
            if(answerTeam === team) { esgrimaPts += q.puntos; history.push({modulo: 'Esgrima', puntos: q.puntos, detalle: `Rueda: ${q.texto.substring(0,20)}...`, evaluador: 'Admin'}); }
        });

        // 4. DINÁMICAS
        dinamicasResultados.forEach(d => {
            if(d.equiposGanadores.includes(team)) {
                dinamicasPts += d.puntosOtorgados;
                const dbInfo = dinamicasDB.find(x => x.id === d.dinamicaId);
                history.push({modulo: 'Dinámicas', puntos: d.puntosOtorgados, detalle: dbInfo ? dbInfo.nombre : 'Juego', evaluador: 'Admin'});
            }
        });

        // 5. RESCATE
        rescateResultados.forEach(r => {
            if (r.equipoAsignado === team && r.contestoPregunta) { rescatePts += r.puntos; history.push({modulo: 'Rescate', puntos: r.puntos, detalle: 'Pregunta', evaluador: 'Admin'}); } 
            else if (r.equipoRebote === team && !r.contestoPregunta) { rescatePts += r.puntos; history.push({modulo: 'Rescate', puntos: r.puntos, detalle: 'Robo', evaluador: 'Admin'}); }
        });

        // 6. SUBASTA
        subastaResultadosDB.forEach(s => {
            if (s.tipo === 'lote' && s.equipoGanadorPV === team) {
                subastaPts += s.puntosPV;
                const loteInfo = subastaLotesDB.find(l => l.id === s.loteId);
                history.push({modulo: 'Subasta', puntos: s.puntosPV, detalle: loteInfo ? `Lote #${loteInfo.numero}: ${loteInfo.nombre}` : 'Lote Comprado', evaluador: 'Admin'});
            } else if (s.tipo === 'bonoBanco' && s.equipo === team) {
                subastaPts += s.puntosPV;
                history.push({modulo: 'Subasta', puntos: s.puntosPV, detalle: `Bono Ahorro (${s.monedasSobrantes} mnd)`, evaluador: 'Admin'});
            }
        });

        const total = parseFloat((versoPts + coroPts + esgrimaPts + dinamicasPts + rescatePts + subastaPts).toFixed(1));
        return { total, versoPts, coroPts, esgrimaPts, dinamicasPts, rescatePts, subastaPts, history: history.reverse() };
    };

    const leaderboard = EQUIPOS.map(eq => ({ equipo: eq, ...getTeamStats(eq) })).sort((a, b) => b.total - a.total);
    const maxTotalPoints = leaderboard.length > 0 ? Math.max(...leaderboard.map(t => t.total), 1) : 1;

    // ==========================================
    // 3. EFECTO TYPEWRITER
    // ==========================================
    useEffect(() => {
        if (screen !== 'welcome' || roleStep !== 'ready') return;
        let vIndex = 0, cIndex = 0, isDeleting = false, timeout;
        const type = () => {
            const currentVerse = verses[vIndex];
            if (isDeleting) { setVerseText(currentVerse.substring(0, cIndex - 1)); cIndex--; } 
            else { setVerseText(currentVerse.substring(0, cIndex + 1)); cIndex++; }
            let typeSpeed = isDeleting ? 20 : 50;
            if (!isDeleting && cIndex === currentVerse.length) { typeSpeed = 3000; isDeleting = true; } 
            else if (isDeleting && cIndex === 0) { isDeleting = false; vIndex = (vIndex + 1) % verses.length; typeSpeed = 500; }
            timeout = setTimeout(type, typeSpeed);
        };
        timeout = setTimeout(type, 500);
        return () => clearTimeout(timeout);
    }, [screen, roleStep]);

    // ==========================================
    // 4. FUNCIONES DE CÁMARA (LÍDER)
    // ==========================================
    const startCamera = async () => { setShowCamera(true); try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); if (videoRef.current) videoRef.current.srcObject = stream; } catch (err) { showToast("No se pudo acceder a la cámara."); setShowCamera(false); } };
    const capturePhoto = () => { const canvas = canvasRef.current; const video = videoRef.current; if (!video || !canvas) return; canvas.width = video.videoWidth; canvas.height = video.videoHeight; canvas.getContext('2d').drawImage(video, 0, 0); canvas.toBlob((blob) => { const file = new File([blob], `captura_${Date.now()}.jpg`, { type: "image/jpeg" }); setCamperFotoObj(file); setCamperFotoPreview(URL.createObjectURL(file)); stopCamera(); }, 'image/jpeg'); };
    const stopCamera = () => { if (videoRef.current && videoRef.current.srcObject) { videoRef.current.srcObject.getTracks().forEach(t => t.stop()); } setShowCamera(false); };

    // ==========================================
    // 5. FUNCIONES DE LOGIN (ADMIN Y LÍDER)
    // ==========================================
    const handleAdminLogin = async (e) => { e.preventDefault(); setIsAdminLoggingIn(true); try { await signInWithEmailAndPassword(auth, adminEmail, adminPassword); setIsAdminLogged(true); setScreen('camp-admin'); showToast("Acceso Autorizado."); } catch (error) { showToast("Credenciales incorrectas."); } finally { setIsAdminLoggingIn(false); } };
    const loginLider = (liderId) => { const liderFound = lideres.find(l => l.id === liderId); setLiderLogueado(liderFound); setScreen('lider-dashboard'); showToast(`¡Bienvenido/a ${liderFound.nombre}!`); };

    // ==========================================
    // 6. FUNCIONES DEL LÍDER (REGISTRO, VERSO, MEJORES)
    // ==========================================
    const agregarAListaLocal = (e) => { e.preventDefault(); if (!camperNum || !camperNombre || !camperEdad || !camperFotoObj) return showToast("Completa todos los campos y la foto."); setLocalCampers([...localCampers, { numero: camperNum, nombre: camperNombre, edad: camperEdad, fotoObj: camperFotoObj, fotoPreview: camperFotoPreview }]); setCamperNum(''); setCamperNombre(''); setCamperEdad(''); setCamperFotoObj(null); setCamperFotoPreview(null); showToast(`Campista #${camperNum} añadido a la lista.`); };
    const guardarRegistroFinal = async () => { if (localCampers.length === 0) return showToast("La lista está vacía."); setIsSubmittingBatch(true); showToast("Subiendo registros a la nube..."); try { for (let c of localCampers) { const fotoRef = ref(storage, `campistas_fotos/${Date.now()}_${c.fotoObj.name}`); await uploadBytes(fotoRef, c.fotoObj); const url = await getDownloadURL(fotoRef); await addDoc(collection(db, "campistas"), { numero: c.numero, nombre: c.nombre, edad: parseInt(c.edad), equipo: liderLogueado.equipo, liderId: liderLogueado.id, fotoUrl: url, fecha: new Date().toISOString() }); } showToast(`¡${localCampers.length} campistas guardados exitosamente!`); setLocalCampers([]); } catch (error) { showToast("Hubo un error al guardar los registros."); } finally { setIsSubmittingBatch(false); } };
    const handleVerseScoreChange = (campistaId, value) => { let num = parseInt(value); if (isNaN(num)) num = ''; if (num > 10) num = 10; setVerseScores({...verseScores, [campistaId]: num}); };
    const guardarEvaluacionVerso = async (targetTeam) => { setIsSubmittingVerso(true); showToast("Guardando notas del verso..."); try { await setDoc(doc(db, "eval_verso", targetTeam), { scores: verseScores, evaluadorId: liderLogueado.id, fecha: new Date().toISOString() }); await setDoc(doc(db, "campamento", "actividades"), { 'eval-verso': { [liderLogueado.equipo]: 'completado' } }, { merge: true }); showToast("¡Evaluación guardada exitosamente!"); setScreen('lider-dashboard'); } catch (error) { showToast("Error al guardar la evaluación."); } finally { setIsSubmittingVerso(false); } };
    const guardarMejorCampista = async () => { if (!selectedBestCamper) return showToast("Debes seleccionar a un campista primero."); setIsSubmittingBest(true); showToast("Guardando al mejor campista..."); try { await setDoc(doc(db, "mejores_campistas", liderLogueado.equipo), { campistaId: selectedBestCamper.id || "", nombre: selectedBestCamper.nombre || "Desconocido", fotoUrl: selectedBestCamper.fotoUrl || "", numero: selectedBestCamper.numero || "", liderId: liderLogueado.id || "", fecha: new Date().toISOString() }); await setDoc(doc(db, "campamento", "actividades"), { 'mejores': { [liderLogueado.equipo]: 'completado' } }, { merge: true }); showToast("¡Mejor campista guardado exitosamente!"); setScreen('lider-dashboard'); } catch (error) { console.error(error); showToast("Error al guardar."); } finally { setIsSubmittingBest(false); } };

    // ==========================================
    // 7. FUNCIONES DEL JUEZ DE CORO
    // ==========================================
    const handleJuezScoreChange = (setter, max, value) => { let num = parseInt(value); if (isNaN(num)) return setter(''); if (num < 0) num = 0; if (num > max) num = max; setter(num); };
    const guardarEvaluacionCoro = async (e) => { e.preventDefault(); if (!juezNombre || !juezEquipo1 || !juezEquipo2 || juezRitmo === '' || juezVolumen === '' || juezCoordinacion === '') return showToast("Completa todos los campos."); if (juezEquipo1 === juezEquipo2) return showToast("Debes seleccionar dos equipos diferentes."); setIsSubmittingJuez(true); showToast("Guardando calificación..."); try { const total = juezRitmo + juezVolumen + juezCoordinacion; await addDoc(collection(db, "eval_coro"), { juezNombre, equipos: [juezEquipo1, juezEquipo2], ritmo: juezRitmo, volumen: juezVolumen, coordinacion: juezCoordinacion, total, fecha: new Date().toISOString() }); setJuezSubmitted(true); showToast("¡Evaluación enviada con éxito!"); } catch (error) { console.error(error); showToast("Error al guardar la evaluación."); } finally { setIsSubmittingJuez(false); } };

    // ==========================================
    // 8. FUNCIONES DEL ANFITRIÓN (CUARTO DE MÁQUINAS)
    // ==========================================
    const handleLiderSubmit = async (e) => { e.preventDefault(); if (!nuevoLider.nombre || !nuevoLider.equipo || !nuevoLider.fotoObj) return showToast("Completa los datos del líder y foto."); setIsSubmittingLider(true); try { const fotoRef = ref(storage, `lideres/${Date.now()}_${nuevoLider.fotoObj.name}`); await uploadBytes(fotoRef, nuevoLider.fotoObj); const url = await getDownloadURL(fotoRef); await addDoc(collection(db, "lideres"), { nombre: nuevoLider.nombre, equipo: nuevoLider.equipo, fotoUrl: url }); showToast("Líder registrado correctamente."); setNuevoLider({ nombre: '', equipo: '', fotoObj: null, fotoPreview: null }); } catch (err) { showToast("Error al crear líder."); } setIsSubmittingLider(false); };
    const toggleActividad = async (modulo, equipo, currentStatus) => { if (currentStatus === 'completado') return showToast("Esta actividad ya fue completada por el líder."); const newStatus = currentStatus === 'offline' ? 'online' : 'offline'; try { await setDoc(doc(db, "campamento", "actividades"), { [modulo]: { [equipo]: newStatus } }, { merge: true }); showToast(`Módulo puesto ${newStatus} para ${equipo}`); } catch (error) { showToast("Error al cambiar el estado."); } };

    const handleCrearPreguntaEsgrima = async (e) => { e.preventDefault(); if (!nuevaPreguntaTexto || nuevaPreguntaPuntos <= 0) return showToast("Escribe la pregunta y puntos válidos."); setIsSubmittingPregunta(true); try { await addDoc(collection(db, "esgrima_preguntas"), { texto: nuevaPreguntaTexto, puntos: nuevaPreguntaPuntos, timestamp: new Date().getTime() }); setNuevaPreguntaTexto(''); setNuevaPreguntaPuntos(5); showToast("Pregunta añadida."); } catch (error) { showToast("Error al crear la pregunta."); } setIsSubmittingPregunta(false); };
    const eliminarPreguntaEsgrima = async (id) => { if (window.confirm("¿Seguro que deseas eliminar esta pregunta?")) { try { await deleteDoc(doc(db, "esgrima_preguntas", id)); showToast("Pregunta eliminada."); } catch(e) { showToast("Error al eliminar."); } } };
    const guardarActividadEsgrima = async (numAct) => { const act = actsLocal[numAct]; if (!act.ganador) return showToast("Selecciona el equipo que ganó la dinámica."); if (act.contesto === null) return showToast("Selecciona si contestaron la pregunta o no."); if (act.contesto === false && !act.rebote) return showToast("Selecciona qué equipo contestó en el rebote."); try { await setDoc(doc(db, "esgrima_actividades", `act${numAct}`), { ganadorDinámica: act.ganador, contestoPregunta: act.contesto, equipoRebote: act.rebote, puntosDinamica: 2, puntosPregunta: 5, timestamp: new Date().getTime() }); showToast(`Actividad ${numAct} guardada permanentemente.`); } catch(e) { showToast("Error al guardar actividad."); } };
    const guardarResultadosEsgrimaTotales = async () => { setIsSubmittingEsgrima(true); try { let puntosEsgrima = { "Rojo": 0, "Verde": 0, "Azul": 0, "Negro": 0 }; [1, 2, 3].forEach(num => { const actData = esgrimaActividadesDB[`act${num}`]; if (actData) { puntosEsgrima[actData.ganadorDinámica] += actData.puntosDinamica; if (actData.contestoPregunta) puntosEsgrima[actData.ganadorDinámica] += actData.puntosPregunta; else if (actData.equipoRebote) puntosEsgrima[actData.equipoRebote] += actData.puntosPregunta; } }); esgrimaPreguntasDB.forEach(q => { const equipoContesto = respuestasEsgrima[q.id]; if (equipoContesto) puntosEsgrima[equipoContesto] += q.puntos; }); await setDoc(doc(db, "esgrima_resultados", "totales"), { respuestasRueda: respuestasEsgrima, puntosTotales: puntosEsgrima, guardadoFinal: true, timestamp: new Date().getTime() }); showToast("Resultados totales de Esgrima calculados y guardados."); } catch (e) { console.error(e); showToast("Error al guardar totales."); } finally { setIsSubmittingEsgrima(false); } };

    const handleCrearDinamica = async (e) => { e.preventDefault(); if (!nuevaDinamica.nombre || !nuevaDinamica.detalles || !nuevaDinamica.puntos) return showToast("Completa los datos de la dinámica."); setIsSubmittingDinamica(true); try { await addDoc(collection(db, "dinamicas_db"), { ...nuevaDinamica, timestamp: new Date().getTime() }); setNuevaDinamica({ nombre: '', detalles: '', puntos: 10, ganadoresValidos: '1' }); showToast("Dinámica creada."); } catch (error) { showToast("Error al crear dinámica."); } setIsSubmittingDinamica(false); };
    const eliminarDinamica = async (id) => { if (window.confirm("¿Eliminar dinámica?")) { try { await deleteDoc(doc(db, "dinamicas_db", id)); showToast("Eliminada."); } catch(e) { showToast("Error."); } } };
    const handleSelectWinnerLocal = (dinId, eq, index, maxAllowed) => { let current = dinamicasGanadoresLocal[dinId] || []; let newSelection = [...current]; newSelection[index] = eq; if(maxAllowed === '1') newSelection = [eq]; setDinamicasGanadoresLocal({...dinamicasGanadoresLocal, [dinId]: newSelection}); };
    const guardarResultadoDinamica = async (dinamica) => { const seleccionados = dinamicasGanadoresLocal[dinamica.id] || []; const validos = seleccionados.filter(e => e); if(validos.length !== parseInt(dinamica.ganadoresValidos)) return showToast(`Debes seleccionar ${dinamica.ganadoresValidos} ganador(es) distintos.`); if(validos.length === 2 && validos[0] === validos[1]) return showToast("No puedes seleccionar el mismo equipo dos veces."); try { await addDoc(collection(db, "dinamicas_resultados"), { dinamicaId: dinamica.id, equiposGanadores: validos, puntosOtorgados: dinamica.puntos, timestamp: new Date().getTime() }); showToast("¡Resultado guardado!"); } catch (error) { showToast("Error al guardar."); } };

    const handleCrearRescate = async (e) => { e.preventDefault(); if (!nuevoRescateTexto || nuevoRescatePuntos <= 0) return showToast("Escribe la pregunta y los puntos."); setIsSubmittingRescate(true); try { await addDoc(collection(db, "rescate_db"), { texto: nuevoRescateTexto, puntos: nuevoRescatePuntos, timestamp: new Date().getTime() }); setNuevoRescateTexto(''); setNuevoRescatePuntos(4); showToast("Rescate añadido."); } catch (error) { showToast("Error al crear rescate."); } setIsSubmittingRescate(false); };
    const eliminarRescate = async (id) => { if (window.confirm("¿Eliminar pregunta de rescate?")) { try { await deleteDoc(doc(db, "rescate_db", id)); showToast("Eliminada."); } catch(e) { showToast("Error."); } } };
    const guardarResultadoRescate = async (rescate) => { const dataLocal = actsRescateLocal[rescate.id]; if (!dataLocal || !dataLocal.equipoAsignado) return showToast("Asigna un equipo a la pregunta."); if (dataLocal.contestoPregunta === undefined) return showToast("Selecciona si contestó o no."); if (dataLocal.contestoPregunta === false && !dataLocal.equipoRebote) return showToast("Selecciona el equipo que robó los puntos."); try { await addDoc(collection(db, "rescate_resultados"), { rescateId: rescate.id, equipoAsignado: dataLocal.equipoAsignado, contestoPregunta: dataLocal.contestoPregunta, equipoRebote: dataLocal.equipoRebote || null, puntos: rescate.puntos, timestamp: new Date().getTime() }); showToast("¡Puntos de rescate asignados!"); } catch (error) { showToast("Error al guardar."); } };

    // ==========================================
    // ANFITRIÓN: MÓDULO SUBASTA (TORRE DE CONTROL Y EJECUCIÓN)
    // ==========================================
    const handleCrearLoteSubasta = async (e) => {
        e.preventDefault();
        if (!nuevoLote.numero || !nuevoLote.nombre || !nuevoLote.base || !nuevoLote.premioPV) return showToast("Completa los datos obligatorios del lote.");
        setIsSubmittingLote(true);
        try {
            let imgUrl = null;
            if (nuevoLote.fotoObj) {
                const fotoRef = ref(storage, `subasta_imagenes/${Date.now()}_${nuevoLote.fotoObj.name}`);
                await uploadBytes(fotoRef, nuevoLote.fotoObj);
                imgUrl = await getDownloadURL(fotoRef);
            }
            await addDoc(collection(db, "subasta_lotes"), {
                numero: parseInt(nuevoLote.numero),
                nombre: nuevoLote.nombre,
                detalle: nuevoLote.detalle,
                base: parseInt(nuevoLote.base),
                premioPV: parseInt(nuevoLote.premioPV),
                riesgo: nuevoLote.riesgo,
                tiempoSecs: parseInt(nuevoLote.tiempoSecs),
                imageUrl: imgUrl,
                timestamp: new Date().getTime()
            });
            setNuevoLote({ numero: '', nombre: '', detalle: '', base: 100, premioPV: 150, riesgo: 'Fácil', tiempoSecs: 0, fotoObj: null, fotoPreview: null });
            showToast("Lote de subasta creado con éxito.");
        } catch (error) { showToast("Error al crear lote."); }
        setIsSubmittingLote(false);
    };

    const eliminarLoteSubasta = async (id) => {
        if (window.confirm("¿Eliminar este lote?")) {
            try { await deleteDoc(doc(db, "subasta_lotes", id)); showToast("Lote eliminado."); } catch(e) { showToast("Error."); }
        }
    };

    const proyectarLote = async (lote, estado) => {
        setSubastaActiveLot(lote);
        setSubastaEjecucion({ comprador: '', cumplio: null, rebote: '', cumplioRebote: null });
        if (sessionCode) {
            await setDoc(doc(db, "sesiones", sessionCode), {
                modo: estado, subastaLoteId: lote.id, 
                timerTarget: estado === 'subasta-activa' && lote.tiempoSecs > 0 ? new Date().getTime() + (lote.tiempoSecs * 1000) : null
            }, { merge: true });
        }
    };

    const terminarLote = async () => {
        if (!subastaActiveLot) return;
        const e = subastaEjecucion;
        
        if (!e.comprador) {
            if (!window.confirm("¿Nadie compró el lote? Terminará sin ganador.")) return;
        } else {
            if (e.cumplio === null) return showToast("Selecciona si el comprador cumplió el reto.");
            if (e.cumplio === false && e.rebote && e.cumplioRebote === null) return showToast("Selecciona si el rebote cumplió el reto.");
        }

        try {
            let ganadorFinal = null;
            if (e.cumplio) ganadorFinal = e.comprador;
            else if (e.cumplio === false && e.cumplioRebote) ganadorFinal = e.rebote;

            if (ganadorFinal) {
                await addDoc(collection(db, "subasta_resultados"), {
                    tipo: 'lote',
                    loteId: subastaActiveLot.id,
                    equipoGanadorPV: ganadorFinal,
                    puntosPV: subastaActiveLot.premioPV,
                    timestamp: new Date().getTime()
                });
                showToast(`¡${subastaActiveLot.premioPV} PV añadidos a ${ganadorFinal}!`);
            } else {
                showToast("Lote finalizado sin ganador de PV.");
            }

            setSubastaActiveLot(null);
            if (sessionCode) await setDoc(doc(db, "sesiones", sessionCode), { modo: 'standby', subastaLoteId: null, timerTarget: null }, { merge: true });

        } catch (err) {
            showToast("Error al guardar el resultado del lote.");
        }
    };

    const guardarBonoBanco = async (e) => {
        e.preventDefault();
        setIsSubmittingBanco(true);
        try {
            for (const eq of EQUIPOS) {
                const monedas = parseInt(sobrantesBanco[eq]);
                if (!isNaN(monedas) && monedas >= 100) {
                    const bonoPV = Math.floor(monedas / 100) * 10;
                    await addDoc(collection(db, "subasta_resultados"), {
                        tipo: 'bonoBanco',
                        equipo: eq,
                        monedasSobrantes: monedas,
                        puntosPV: bonoPV,
                        timestamp: new Date().getTime()
                    });
                }
            }
            await setDoc(doc(db, "campamento", "actividades"), { 'subasta': { global: 'completado' } }, { merge: true });
            showToast("Bonos de Banco calculados y guardados.");
        } catch (err) {
            showToast("Error al procesar el banco.");
        } finally {
            setIsSubmittingBanco(false);
        }
    };

    const handleWipeDatabase = async (e) => {
        e.preventDefault();
        setIsWiping(true);
        try {
            await signInWithEmailAndPassword(auth, wipeEmail, wipePassword);
            const batch = writeBatch(db);
            const collectionsToWipe = ['campistas', 'lideres', 'eval_verso', 'eval_coro', 'mejores_campistas', 'esgrima_preguntas', 'esgrima_actividades', 'esgrima_resultados', 'dinamicas_db', 'dinamicas_resultados', 'rescate_db', 'rescate_resultados', 'subasta_lotes', 'subasta_resultados', 'campamento'];
            
            for (const coll of collectionsToWipe) {
                const snap = await getDocs(collection(db, coll));
                snap.docs.forEach(d => batch.delete(d.ref));
            }
            await batch.commit();
            showToast("¡LA BASE DE DATOS HA SIDO FORMATEADA CON ÉXITO!");
            setShowWipeModal(false); setWipeEmail(''); setWipePassword('');
            window.location.reload(); 
        } catch (error) { console.error(error); showToast("Error crítico: Verifique sus credenciales."); } finally { setIsWiping(false); }
    };

        // ==========================================
    // 9. FUNCIONES DEL HIMNARIO Y PROYECTOR (CONEXIÓN PERMANENTE)
    // ==========================================
    const handleConnect = async () => {
        if (pinInput.length !== 4 || !/^[0-9]+$/.test(pinInput)) return showToast("El código debe tener 4 dígitos.");
        setSessionCode(pinInput);
        
        // Guardar en la memoria del navegador para sobrevivir a las recargas
        localStorage.setItem('hymnSession', JSON.stringify({ code: pinInput, savedRole: role }));

        if (role === 'control') {
            const docRef = doc(db, "sesiones", pinInput);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                // Sala nueva
                await setDoc(docRef, { modo: 'standby', himnoId: null, slideIndex: 0, fontSize: 2.5, proyectorConectado: false, subastaLoteId: null, timerTarget: null });
            } else {
                // Si el control se reconecta, usamos merge: true para no desconectar al proyector
                await setDoc(docRef, { modo: 'standby' }, { merge: true });
            }
            setRoleStep('ready'); setScreen('welcome');
        } else if (role === 'proyector') {
            const docSnap = await getDoc(doc(db, "sesiones", pinInput));
            if (docSnap.exists()) {
                await setDoc(doc(db, "sesiones", pinInput), { proyectorConectado: true }, { merge: true });
                setRoleStep('ready'); setScreen('welcome');
            } else { 
                showToast("⚠️ Sala no encontrada. Conecta el Control primero."); 
                setPinInput(''); 
                localStorage.removeItem('hymnSession'); // Limpiar si falló
            }
        }
    };

    // NUEVA FUNCIÓN: Salir de la sala voluntariamente
    const handleDisconnect = async () => {
        if (role === 'proyector' && sessionCode) {
            await setDoc(doc(db, "sesiones", sessionCode), { proyectorConectado: false }, { merge: true });
        }
        localStorage.removeItem('hymnSession');
        setSessionCode('');
        setRole(null);
        setRoleStep('select');
        setScreen('welcome');
        setPinInput('');
        showToast("Desconectado de la sala exitosamente.");
    };  

    const emitirAProyector = async (modo, himnoId, index) => { if (role === 'control' && sessionCode) await setDoc(doc(db, "sesiones", sessionCode), { modo, himnoId, slideIndex: index }, { merge: true }); };
    const cambiarTamanoLetra = async (cambio, e) => { if (e) e.stopPropagation(); let nuevoTamano = Math.min(Math.max(fontSize + cambio, 1.5), 6.0); setFontSize(nuevoTamano); if (role === 'control' && sessionCode) await setDoc(doc(db, "sesiones", sessionCode), { fontSize: nuevoTamano }, { merge: true }); };

    useEffect(() => {
        if (!sessionCode) return;
        
        let interval;
        const unsub = onSnapshot(doc(db, "sesiones", sessionCode), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                if (role === 'proyector') {
                    if (data.fontSize && data.fontSize !== fontSize) setFontSize(data.fontSize);
                    
                    if (data.modo === 'standby') {
                        setScreen('welcome');
                        setTimerRemaining(null);
                    }
                    else if (data.modo === 'himno' && data.himnoId) {
                        const targetHymn = allHymns.find(h => h.id_doc === data.himnoId);
                        if (targetHymn) { cargarDiapositivasLocal(targetHymn); setSlideIndex(data.slideIndex); setScreen('viewer'); }
                    }
                    else if (data.modo === 'subasta-previa' || data.modo === 'subasta-activa') {
                        const targetLote = subastaLotesDB.find(l => l.id === data.subastaLoteId);
                        if (targetLote) {
                            setSubastaActiveLot(targetLote);
                            setScreen(data.modo); 

                            if (data.modo === 'subasta-activa' && data.timerTarget) {
                                clearInterval(interval);
                                interval = setInterval(() => {
                                    const now = new Date().getTime();
                                    const diff = Math.max(0, Math.floor((data.timerTarget - now) / 1000));
                                    setTimerRemaining(diff);

                                    if (diff > 0 && diff <= 10) {
                                        if (tickAudioRef.current) {
                                            tickAudioRef.current.currentTime = 0;
                                            tickAudioRef.current.play().catch(e => console.log('Audio autoplay blocked', e));
                                        }
                                    } else if (diff === 0) {
                                        clearInterval(interval);
                                        if (alarmAudioRef.current) {
                                            alarmAudioRef.current.currentTime = 0;
                                            alarmAudioRef.current.play().catch(e => console.log('Audio autoplay blocked', e));
                                        }
                                    }
                                }, 1000);
                            } else {
                                setTimerRemaining(null);
                                clearInterval(interval);
                            }
                        }
                    }
                } else if (role === 'control') {
                    setProyectorConectado(!!data.proyectorConectado);
                }
            }
        });
        return () => { unsub(); clearInterval(interval); };
    }, [role, sessionCode, allHymns, fontSize, subastaLotesDB]);

    const cargarDiapositivasLocal = (hymn) => {
        setCurrentHymn(hymn); let newSlides = [];
        const process = (textArray) => { textArray.forEach(estrofa => { if(estrofa.trim().length > 0) { newSlides.push({ text: estrofa, type: 'verse' }); if (hymn.tiene_coro && hymn.coro) newSlides.push({ text: hymn.coro, type: 'chorus' }); } }); };
        if (hymn.estrofas && Array.isArray(hymn.estrofas)) process(hymn.estrofas);
        else if (hymn.letra) process(hymn.letra.split(/\n\n+/).length === 1 ? hymn.letra.split(/\n/) : hymn.letra.split(/\n\n+/));
        setSlides(newSlides);
    };

    const openHymn = async (hymn) => { cargarDiapositivasLocal(hymn); setSlideIndex(0); setScreen('viewer'); emitirAProyector('himno', hymn.id_doc, 0); };
    const goBackToMenu = () => { setScreen('menu'); emitirAProyector('standby', null, 0); };
    const nextSlide = (e) => { if (e) e.stopPropagation(); if (slideIndex < slides.length - 1) { setSlideIndex(slideIndex + 1); emitirAProyector('himno', currentHymn.id_doc, slideIndex + 1); } };
    const prevSlide = (e) => { if (e) e.stopPropagation(); if (slideIndex > 0) { setSlideIndex(slideIndex - 1); emitirAProyector('himno', currentHymn.id_doc, slideIndex - 1); } };
    const showRange = (min, max, type = "Himno") => { setRangeTitle(type === "Coro" ? "Coros" : `Himnos ${min} - ${max}`); setFilteredHymns(allHymns.filter(h => h.numero >= min && h.numero <= max && h.tipo === type && h.activo)); setScreen('list'); };
    const normalizeText = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const handleSearch = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            const val = document.getElementById('searchInput').value.trim();
            if (!val) return;
            const hymn = !isNaN(val) ? allHymns.find(h => h.numero === parseInt(val) && h.tipo === "Himno") : allHymns.find(h => h.titulo && normalizeText(h.titulo).includes(normalizeText(val)));
            if (hymn) { document.getElementById('searchInput').value = ""; openHymn(hymn); } else showToast(`No se encontró "${val}"`);
        }
    };
    const showVideoList = (tracks, title) => { setVideoTitle(title); setActiveVideoList(tracks); setScreen('videos'); };
    const playVideo = (track) => { setCurrentVideo(track); setScreen('video-player'); };

    // ==========================================
    // RENDERIZADO PRINCIPAL
    // ==========================================

    if (roleStep !== 'ready') {
        return (
            <section className="screen" style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--dark-bg)' }}>
                <div className="particles"></div>
                <h1 className="main-title" style={{fontSize: '3rem', marginBottom: '40px'}}>Conexión</h1>

                {roleStep === 'select' && (
                    <>
                        <button className="btn-start" style={{marginBottom: '20px', width: '280px', justifyContent: 'center'}} onClick={() => { setRole('control'); setRoleStep('pin'); }}>📱 MODO CONTROL</button>
                        <button className="btn-start" style={{width: '280px', justifyContent: 'center'}} onClick={() => { setRole('proyector'); setRoleStep('pin'); }}>🖥️ MODO PROYECTOR</button>
                    </>
                )}

                {roleStep === 'pin' && (
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', zIndex: 10}}>
                        <p style={{fontSize: '1.2rem', opacity: 0.9, textAlign: 'center', padding: '0 20px'}}>{role === 'control' ? 'Crea un PIN de 4 dígitos para tu sala:' : 'Ingresa el PIN de 4 dígitos del control:'}</p>
                        <input type="text" maxLength="4" value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} style={{fontSize: '2.5rem', padding: '15px', width: '180px', textAlign: 'center', borderRadius: '15px', border: '2px solid var(--accent)', background: 'rgba(255,255,255,0.1)', color: 'var(--accent)', outline: 'none', fontWeight: 'bold', letterSpacing: '10px'}} placeholder="0000" />
                        <button className="btn-start" style={{marginTop: '10px'}} onClick={handleConnect}>CONECTAR <i className="fas fa-link"></i></button>
                        <button className="glass-btn" style={{marginTop: '20px'}} onClick={() => { setRoleStep('select'); setPinInput(''); }}><i className="fas fa-arrow-left"></i> Volver</button>
                    </div>
                )}
            </section>
        );
    }

    return (
        <>
            {/* ELEMENTOS DE AUDIO OCULTOS PARA EL PROYECTOR */}
            {role === 'proyector' && (
                <>
                    <audio ref={tickAudioRef} src="/tick.mp3" preload="auto"></audio>
                    <audio ref={alarmAudioRef} src="/alarm.mp3" preload="auto"></audio>
                </>
            )}

            {/* ALERTA GLOBAL TOAST */}
            {toastMsg && <div className="custom-toast">{toastMsg}</div>}

            {/* MODAL PARA COPIAR ENLACES */}
            {showLinkModal && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal-content">
                        <h3 style={{marginTop: 0, color: 'var(--accent)', fontSize: '1.5rem'}}>{modalTitle}</h3>
                        <p style={{color: 'var(--text-muted)'}}>Copia y comparte este enlace de acceso directo:</p>
                        <div style={{display: 'flex', gap: '10px', marginTop: '20px', marginBottom: '25px', flexDirection: 'column'}}>
                            <input type="text" readOnly value={modalUrl} style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none', fontSize: '0.9rem'}} />
                            <button className="btn-start" style={{margin: 0, padding: '10px 15px'}} onClick={() => { navigator.clipboard.writeText(modalUrl); showToast("¡Enlace copiado al portapapeles!"); }}>
                                <i className="fas fa-copy"></i> Copiar
                            </button>
                        </div>
                        <button className="glass-btn" onClick={() => setShowLinkModal(false)} style={{width: '100%'}}>Cerrar Ventana</button>
                    </div>
                </div>
            )}

            {/* MODAL PARA BORRAR BASE DE DATOS */}
            {showWipeModal && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal-content" style={{border: '2px solid #e74c3c'}}>
                        <h3 style={{marginTop: 0, color: '#e74c3c', fontSize: '1.8rem'}}><i className="fas fa-exclamation-triangle"></i> ¡ZONA DE PELIGRO!</h3>
                        <p style={{color: 'white', lineHeight: '1.5'}}>Estás a punto de <strong>eliminar permanentemente</strong> todos los campistas, líderes, evaluaciones, lotes y configuraciones del sistema. Esta acción no se puede deshacer.</p>
                        <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Ingresa tus credenciales de administrador para confirmar:</p>
                        
                        <form onSubmit={handleWipeDatabase} style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px', marginBottom: '20px'}}>
                            <input type="email" placeholder="Correo de Administrador" required value={wipeEmail} onChange={(e) => setWipeEmail(e.target.value)} style={{padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none', textAlign: 'center'}} />
                            <input type="password" placeholder="Contraseña" required value={wipePassword} onChange={(e) => setWipePassword(e.target.value)} style={{padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none', textAlign: 'center'}} />
                            
                            <div style={{display: 'flex', gap: '10px', flexDirection: 'column'}}>
                                <button type="submit" disabled={isWiping} className="btn-start" style={{width: '100%', margin: 0, background: isWiping ? 'gray' : '#e74c3c', borderColor: '#e74c3c', color: 'white', justifyContent: 'center'}}>
                                    {isWiping ? 'Borrando...' : 'Formatear Sistema'}
                                </button>
                                <button type="button" className="glass-btn" style={{width: '100%'}} onClick={() => {setShowWipeModal(false); setWipeEmail(''); setWipePassword('');}}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =========================================
                LOGIN DEL ADMINISTRADOR DEL CAMPAMENTO
                ========================================= */}
            {screen === 'admin-login' && role === 'control' && (
                <section className="screen" style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--dark-bg)' }}>
                    <div className="particles"></div>
                    <img src="/logo.png" alt="Logo" className="logo-container" style={{animation: 'float 6s ease-in-out infinite', width: '150px', height: '150px'}} />
                    <h1 className="main-title" style={{fontSize: '2.5rem', textAlign: 'center', marginBottom: '30px'}}>Administrador</h1>
                    
                    <form onSubmit={handleAdminLogin} style={{background: 'rgba(0, 43, 85, 0.6)', padding: '40px', borderRadius: '15px', backdropFilter: 'blur(10px)', zIndex: 10, width: '90%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '20px'}}>
                        <input type="email" placeholder="Correo electrónico" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} style={{padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none', fontSize: '1rem'}} />
                        <input type="password" placeholder="Contraseña" required value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} style={{padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none', fontSize: '1rem'}} />
                        
                        <button type="submit" disabled={isAdminLoggingIn} className="btn-start" style={{justifyContent: 'center', marginTop: '10px'}}>
                            {isAdminLoggingIn ? 'Verificando...' : <><i className="fas fa-lock"></i> Entrar al Panel</>}
                        </button>
                        <button type="button" className="glass-btn" style={{marginTop: '10px'}} onClick={() => setScreen('welcome')}>
                            <i className="fas fa-arrow-left"></i> Volver al Inicio
                        </button>
                    </form>
                </section>
            )}

            {/* =========================================
                VISTAS DEL JUEZ (EVALUACIÓN DE CORO)
                ========================================= */}
            {role === 'juez' && (
                <section className="screen" style={{ flexDirection: 'column', alignItems: 'center', background: 'var(--dark-bg)', overflowY: 'auto', padding: '20px' }}>
                    <div className="particles"></div>
                    <img src="/logo.png" alt="Logo" style={{width: '80px', height: '80px', borderRadius: '50%', marginBottom: '15px', zIndex: 10}} />
                    
                    <div style={{background: 'rgba(0, 43, 85, 0.6)', padding: '25px', borderRadius: '15px', backdropFilter: 'blur(10px)', zIndex: 10, width: '100%', maxWidth: '500px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}}>
                        {juezSubmitted ? (
                            <div style={{textAlign: 'center', padding: '30px 0', animation: 'fadeIn 0.5s ease-out'}}>
                                <i className="fas fa-check-circle" style={{fontSize: '5rem', color: '#2ecc71', marginBottom: '20px'}}></i>
                                <h2 style={{color: 'white', margin: 0}}>¡Gracias, {juezNombre}!</h2>
                                <p style={{color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '10px'}}>Tu calificación ha sido registrada en el sistema exitosamente.</p>
                            </div>
                        ) : (
                            <form onSubmit={guardarEvaluacionCoro} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                                <h2 style={{color: 'var(--accent)', margin: 0, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px'}}>Evaluación de Coro</h2>
                                
                                <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                                    <label style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Nombre del Jurado:</label>
                                    <input type="text" placeholder="Escribe tu nombre" value={juezNombre} onChange={(e) => setJuezNombre(e.target.value)} style={{padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none'}} />
                                </div>

                                <div style={{background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)'}}>
                                    <h4 style={{margin: '0 0 10px 0', color: 'white'}}>Equipos en Presentación:</h4>
                                    <div style={{display: 'flex', gap: '10px'}}>
                                        <select value={juezEquipo1} onChange={(e) => setJuezEquipo1(e.target.value)} style={{flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid gray', outline: 'none'}}>
                                            <option value="">-- Equipo 1 --</option>
                                            {EQUIPOS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                                        </select>
                                        <select value={juezEquipo2} onChange={(e) => setJuezEquipo2(e.target.value)} style={{flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid gray', outline: 'none'}}>
                                            <option value="">-- Equipo 2 --</option>
                                            {EQUIPOS.filter(eq => eq !== juezEquipo1).map(eq => <option key={eq} value={eq}>{eq}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                                    <h4 style={{margin: 0, color: 'var(--accent)', borderBottom: '1px solid rgba(255,215,0,0.3)', paddingBottom: '5px'}}>Rúbrica de Evaluación</h4>
                                    
                                    <div className="rubric-row">
                                        <div style={{flex: 1, paddingRight: '15px'}}>
                                            <div style={{color: 'white', fontWeight: 'bold'}}>1. Ritmo y Sincronización</div>
                                            <div style={{color: 'gray', fontSize: '0.8rem'}}>Entradas y salidas a tiempo, pulso constante. (Máx 30)</div>
                                        </div>
                                        <input type="number" inputMode="numeric" pattern="[0-9]*" placeholder="0-30" value={juezRitmo} onChange={(e) => handleJuezScoreChange(setJuezRitmo, 30, e.target.value)} style={{width: '80px', padding: '12px', borderRadius: '8px', border: '1px solid var(--accent)', background: 'rgba(0,0,0,0.8)', color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'center', outline: 'none'}} />
                                    </div>

                                    <div className="rubric-row">
                                        <div style={{flex: 1, paddingRight: '15px'}}>
                                            <div style={{color: 'white', fontWeight: 'bold'}}>2. Volumen y Proyección</div>
                                            <div style={{color: 'gray', fontSize: '0.8rem'}}>Sonido suficiente y adecuado al espacio. (Máx 30)</div>
                                        </div>
                                        <input type="number" inputMode="numeric" pattern="[0-9]*" placeholder="0-30" value={juezVolumen} onChange={(e) => handleJuezScoreChange(setJuezVolumen, 30, e.target.value)} style={{width: '80px', padding: '12px', borderRadius: '8px', border: '1px solid var(--accent)', background: 'rgba(0,0,0,0.8)', color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'center', outline: 'none'}} />
                                    </div>

                                    <div className="rubric-row">
                                        <div style={{flex: 1, paddingRight: '15px'}}>
                                            <div style={{color: 'white', fontWeight: 'bold'}}>3. Coordinación del Grupo</div>
                                            <div style={{color: 'gray', fontSize: '0.8rem'}}>Unidad en movimientos y trabajo en equipo. (Máx 40)</div>
                                        </div>
                                        <input type="number" inputMode="numeric" pattern="[0-9]*" placeholder="0-40" value={juezCoordinacion} onChange={(e) => handleJuezScoreChange(setJuezCoordinacion, 40, e.target.value)} style={{width: '80px', padding: '12px', borderRadius: '8px', border: '1px solid var(--accent)', background: 'rgba(0,0,0,0.8)', color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'center', outline: 'none'}} />
                                    </div>

                                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '15px', fontSize: '1.2rem', fontWeight: 'bold', color: 'white', background: 'rgba(255,215,0,0.1)', borderRadius: '10px', border: '1px solid var(--accent)'}}>
                                        <span>Sumatoria Total:</span>
                                        <span style={{color: 'var(--accent)'}}>{(juezRitmo || 0) + (juezVolumen || 0) + (juezCoordinacion || 0)} / 100</span>
                                    </div>
                                </div>

                                <button type="submit" disabled={isSubmittingJuez} className="btn-start" style={{marginTop: '10px', width: '100%', justifyContent: 'center'}}>
                                    {isSubmittingJuez ? 'Enviando...' : <><i className="fas fa-check"></i> Guardar Calificación</>}
                                </button>
                            </form>
                        )}
                    </div>
                </section>
            )}

            {/* =========================================
                VISTAS DEL LÍDER (LOGIN, DASHBOARD, REGISTRO, VERSO, MEJORES)
                ========================================= */}
            {role === 'lider' && (
                <>
                    {/* LOGIN DEL LÍDER */}
                    {screen === 'lider-login' && (
                        <section className="screen" style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--dark-bg)' }}>
                            <div className="particles"></div>
                            <img src="/logo.png" alt="Logo" style={{width: '100px', height: '100px', borderRadius: '50%', marginBottom: '15px', zIndex: 10}} />
                            <h1 className="main-title" style={{fontSize: '2.5rem', textAlign: 'center'}}>Acceso a Líderes</h1>
                            
                            <div style={{background: 'rgba(0, 43, 85, 0.6)', padding: '30px', borderRadius: '15px', backdropFilter: 'blur(10px)', zIndex: 10, width: '90%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}}>
                                <p style={{textAlign: 'center', color: 'var(--text-muted)'}}>Selecciona tu perfil para ingresar:</p>
                                {lideres.length === 0 ? <p style={{color: 'var(--accent)', textAlign: 'center'}}>Aún no hay líderes registrados.</p> : (
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                                        {lideres.map(l => (
                                            <button key={l.id} className="glass-btn" style={{justifyContent: 'flex-start', padding: '15px', borderLeft: `5px solid ${colorMap[l.equipo]}`, background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}} onClick={() => loginLider(l.id)}>
                                                <img src={l.fotoUrl} style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${colorMap[l.equipo]}`}} alt="" />
                                                <span style={{fontSize: '1.1rem', textTransform: 'uppercase'}}>{l.nombre} <span style={{fontSize: '0.8rem', color: colorMap[l.equipo]}}>(Equipo {l.equipo})</span></span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* DASHBOARD DEL LÍDER */}
                    {screen === 'lider-dashboard' && liderLogueado && (() => {
                        const versoStatus = actividades?.['eval-verso']?.[liderLogueado.equipo] || 'offline';
                        const bestStatus = actividades?.['mejores']?.[liderLogueado.equipo] || 'offline';
                        
                        const isVersoActive = versoStatus === 'online';
                        const isVersoCompleted = versoStatus === 'completado';
                        const dotColorVerso = isVersoCompleted ? '#ffd700' : isVersoActive ? '#2ecc71' : '#e74c3c';

                        const isBestActive = bestStatus === 'online';
                        const isBestCompleted = bestStatus === 'completado';
                        const dotColorBest = isBestCompleted ? '#ffd700' : isBestActive ? '#2ecc71' : '#e74c3c';

                        return (
                            <section className="screen" style={{ flexDirection: 'column', alignItems: 'center', background: 'var(--dark-bg)', padding: '30px 20px', overflowY: 'auto' }}>
                                <div className="particles"></div>
                                <img src="/logo.png" alt="Watermark" className="watermark-logo" style={{opacity: 0.05}} />

                                <div style={{display: 'flex', alignItems: 'center', gap: '15px', zIndex: 10, marginBottom: '40px', background: 'rgba(0,0,0,0.5)', padding: '10px 20px', borderRadius: '30px', border: `1px solid ${colorMap[liderLogueado.equipo]}`}}>
                                    <img src={liderLogueado.fotoUrl} style={{width: '50px', height: '50px', borderRadius: '50%', border: `2px solid ${colorMap[liderLogueado.equipo]}`}} alt="" />
                                    <div>
                                        <div style={{fontWeight: 'bold', fontSize: '1.1rem', color: 'white'}}>{liderLogueado.nombre}</div>
                                        <div style={{color: colorMap[liderLogueado.equipo], fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Líder Equipo {liderLogueado.equipo}</div>
                                    </div>
                                </div>

                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', width: '100%', maxWidth: '600px', zIndex: 10, paddingBottom: '30px'}}>
                                    <div className="cat-card" onClick={() => setScreen('lider-registro')}>
                                        <i className="fas fa-user-plus"></i><h3>Registrar Campistas</h3>
                                        <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0}}>Inscribe a tu propio equipo</p>
                                    </div>
                                    
                                    <div className="cat-card" onClick={() => { if(isVersoActive) setScreen('lider-verso'); else showToast("Esperando activación del administrador."); }} style={{opacity: isVersoActive ? 1 : 0.6, cursor: isVersoActive ? 'pointer' : 'not-allowed', position: 'relative'}}>
                                        <div style={{position: 'absolute', top: '15px', right: '15px'}}>
                                            <span style={{width: '12px', height: '12px', borderRadius: '50%', background: dotColorVerso, boxShadow: `0 0 10px ${dotColorVerso}`, display: 'inline-block'}}></span>
                                        </div>
                                        <i className="fas fa-book-open"></i><h3>Evaluar Verso</h3>
                                        <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0}}>{isVersoCompleted ? 'Evaluación guardada' : isVersoActive ? 'Califica a otro equipo' : 'Esperando activación...'}</p>
                                    </div>

                                    <div className="cat-card" onClick={() => { if(isBestActive) setScreen('lider-mejores'); else showToast("Esperando activación del administrador."); }} style={{opacity: isBestActive ? 1 : 0.6, cursor: isBestActive ? 'pointer' : 'not-allowed', position: 'relative'}}>
                                        <div style={{position: 'absolute', top: '15px', right: '15px'}}>
                                            <span style={{width: '12px', height: '12px', borderRadius: '50%', background: dotColorBest, boxShadow: `0 0 10px ${dotColorBest}`, display: 'inline-block'}}></span>
                                        </div>
                                        <i className="fas fa-star"></i><h3>Mejor Campista</h3>
                                        <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0}}>{isBestCompleted ? 'Selección guardada' : isBestActive ? 'Elige al destacado' : 'Esperando activación...'}</p>
                                    </div>
                                </div>
                            </section>
                        );
                    })()}

                    {/* REGISTRO POR LOTES DEL LÍDER */}
{screen === 'lider-registro' && liderLogueado && (
    <section className="screen" style={{ flexDirection: 'column', alignItems: 'center', background: 'var(--dark-bg)', overflowY: 'auto', padding: '20px', paddingBottom: '120px' }}>
        <div className="particles"></div>
        
        <div style={{display: 'flex', width: '100%', maxWidth: '400px', justifyContent: 'space-between', zIndex: 10, marginBottom: '20px', flexShrink: 0}}>
            <button className="glass-btn" onClick={() => setScreen('lider-dashboard')}><i className="fas fa-arrow-left"></i> Volver</button>
            <h2 style={{color: colorMap[liderLogueado.equipo], margin: 0, textTransform: 'uppercase'}}>Equipo {liderLogueado.equipo}</h2>
        </div>

        {/* Formulario de Ingreso */}
        <form onSubmit={agregarAListaLocal} style={{display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '400px', zIndex: 10, background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '15px', borderTop: `4px solid ${colorMap[liderLogueado.equipo]}`, backdropFilter: 'blur(10px)', flexShrink: 0}}>
            <h3 style={{margin: 0, color: 'white', textAlign: 'center'}}>Añadir a la lista</h3>
            
            {showCamera ? (
                <div className="camera-container">
                    <video ref={videoRef} autoPlay playsInline className="camera-video" />
                    <div className="camera-action-btns">
                        <button type="button" className="btn-start" style={{margin: 0, padding: '8px 15px'}} onClick={capturePhoto}><i className="fas fa-camera"></i> Tomar</button>
                        <button type="button" className="glass-btn" onClick={stopCamera}>Cancelar</button>
                    </div>
                    <canvas ref={canvasRef} style={{display: 'none'}} />
                </div>
            ) : (
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'}}>
                    {camperFotoPreview ? (
                        <img src={camperFotoPreview} alt="Preview" style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%', border: `3px solid ${colorMap[liderLogueado.equipo]}`}} />
                    ) : (
                        <div style={{width: '100px', height: '100px', borderRadius: '50%', border: '2px dashed gray', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><i className="fas fa-user" style={{fontSize: '2rem', color: 'gray'}}></i></div>
                    )}
                    
                    <div className="camera-action-btns">
                        <button type="button" className="glass-btn" onClick={startCamera}><i className="fas fa-camera"></i> Cámara</button>
                        <label className="glass-btn" style={{cursor: 'pointer', margin: 0}}>
                            <i className="fas fa-upload"></i> Subir
                            <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => { if(e.target.files[0]) { setCamperFotoObj(e.target.files[0]); setCamperFotoPreview(URL.createObjectURL(e.target.files[0])); } }} />
                        </label>
                    </div>
                </div>
            )}

            <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                <input type="number" placeholder="N°" value={camperNum} onChange={(e) => setCamperNum(e.target.value)} style={{flex: '1 1 30%', minWidth: '80px', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none'}} />
                <input type="number" placeholder="Edad" value={camperEdad} onChange={(e) => setCamperEdad(e.target.value)} style={{flex: '2 1 50%', minWidth: '100px', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none'}} />
            </div>
            <input type="text" placeholder="Nombre y Apellidos" value={camperNombre} onChange={(e) => setCamperNombre(e.target.value)} style={{padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none'}} />
            
            <button type="submit" className="glass-btn" style={{borderColor: 'var(--accent)', color: 'var(--accent)'}}>
                <i className="fas fa-plus"></i> Añadir a la lista
            </button>
        </form>

        {/* Lista Pendiente y Botón de Subida */}
        {localCampers.length > 0 && (
            <div style={{width: '100%', maxWidth: '400px', zIndex: 10, marginTop: '20px', display: 'flex', flexDirection: 'column', flexShrink: 0}}>
                <h3 style={{color: 'white', textAlign: 'center', marginBottom: '10px'}}>Lista Pendiente ({localCampers.length})</h3>
                
                {/* SCROLL INTERNO PARA LA LISTA (Mantiene el botón a la vista) */}
                <div style={{maxHeight: '30vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '5px', marginBottom: '15px'}}>
                    {localCampers.map((c, i) => (
                        <div key={i} className="local-camper-item" style={{margin: 0}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                <img src={c.fotoPreview} style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover'}} alt="" />
                                <div><div style={{color: 'white', fontWeight: 'bold'}}>#{c.numero} {c.nombre}</div><div style={{color: 'gray', fontSize: '0.8rem'}}>{c.edad} años</div></div>
                            </div>
                            <button className="glass-btn" style={{padding: '5px 10px', color: '#e74c3c', borderColor: 'transparent'}} onClick={() => setLocalCampers(localCampers.filter((_, index) => index !== i))}><i className="fas fa-trash"></i></button>
                        </div>
                    ))}
                </div>

                <button className="btn-start" disabled={isSubmittingBatch} onClick={guardarRegistroFinal} style={{width: '100%', justifyContent: 'center', background: isSubmittingBatch ? 'gray' : 'var(--accent)', color: '#000'}}>
                    {isSubmittingBatch ? 'Guardando en la Nube...' : <><i className="fas fa-cloud-upload-alt"></i> Subir Registros a Firebase</>}
                </button>
            </div>
        )}
    </section>
)}

                    {/* EVALUACIÓN DE VERSO DEL LÍDER */}
                    {screen === 'lider-verso' && liderLogueado && (() => {
                        const myIndex = EQUIPOS.indexOf(liderLogueado.equipo);
                        const targetTeamIndex = (myIndex + 1) % EQUIPOS.length;
                        const targetTeam = EQUIPOS[targetTeamIndex];
                        const targetCampers = campistas.filter(c => c.equipo === targetTeam);
                        const evalYaEnviada = actividades?.['eval-verso']?.[liderLogueado.equipo] === 'completado';

                        return (
                            <section className="screen" style={{ flexDirection: 'column', alignItems: 'center', background: 'var(--dark-bg)', overflowY: 'auto', padding: '20px' }}>
                                <div className="particles"></div>
                                <div style={{display: 'flex', width: '100%', maxWidth: '500px', justifyContent: 'space-between', zIndex: 10, marginBottom: '20px'}}>
                                    <button className="glass-btn" onClick={() => setScreen('lider-dashboard')}><i className="fas fa-arrow-left"></i> Volver</button>
                                    <h2 style={{color: 'white', margin: 0}}><i className="fas fa-book-open" style={{color: 'var(--accent)'}}></i> Verso</h2>
                                </div>

                                <div style={{zIndex: 10, background: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '15px', width: '100%', maxWidth: '500px', borderTop: `5px solid ${colorMap[targetTeam]}`}}>
                                    <h3 style={{textAlign: 'center', margin: '0 0 5px 0', color: 'var(--text-muted)'}}>Te corresponde evaluar al</h3>
                                    <h2 style={{textAlign: 'center', margin: '0 0 20px 0', color: colorMap[targetTeam], textTransform: 'uppercase', fontSize: '2rem'}}>Equipo {targetTeam}</h2>

                                    {targetCampers.length === 0 ? (
                                        <p style={{textAlign: 'center', color: 'var(--accent)'}}>Este equipo aún no ha registrado campistas.</p>
                                    ) : evalYaEnviada ? (
                                        <div style={{textAlign: 'center', padding: '30px 0'}}>
                                            <i className="fas fa-check-circle" style={{fontSize: '4rem', color: '#2ecc71', marginBottom: '15px'}}></i>
                                            <h3 style={{color: 'white', margin: 0}}>¡Evaluación Completada!</h3>
                                            <p style={{color: 'var(--text-muted)'}}>Las notas ya fueron enviadas al sistema.</p>
                                        </div>
                                    ) : (
                                        <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                                            {targetCampers.map(c => (
                                                <div key={c.id} className="rubric-row">
                                                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                                        <img src={c.fotoUrl} style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover'}} alt="" />
                                                        <div><div style={{color: 'white', fontWeight: 'bold'}}>#{c.numero || "?"} {c.nombre}</div></div>
                                                    </div>
                                                    <input 
                                                        type="number" inputMode="numeric" pattern="[0-9]*" min="0" max="10" placeholder="0-10"
                                                        value={verseScores[c.id] || ''} 
                                                        onChange={(e) => handleVerseScoreChange(c.id, e.target.value)}
                                                        style={{width: '65px', padding: '10px', borderRadius: '8px', border: '1px solid var(--accent)', background: 'rgba(0,0,0,0.5)', color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'center', outline: 'none'}}
                                                    />
                                                </div>
                                            ))}
                                            
                                            <button className="btn-start" disabled={isSubmittingVerso} onClick={() => guardarEvaluacionVerso(targetTeam)} style={{marginTop: '15px', width: '100%', justifyContent: 'center'}}>
                                                {isSubmittingVerso ? 'Guardando...' : <><i className="fas fa-save"></i> Enviar Calificaciones</>}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </section>
                        );
                    })()}

                    {/* ELECCIÓN DEL MEJOR CAMPISTA DEL LÍDER */}
                    {screen === 'lider-mejores' && liderLogueado && (() => {
                        const myCampers = campistas.filter(c => c.equipo === liderLogueado.equipo);
                        const isBestCompleted = actividades?.['mejores']?.[liderLogueado.equipo] === 'completado';

                        return (
                            <section className="screen" style={{ flexDirection: 'column', alignItems: 'center', background: 'var(--dark-bg)', overflowY: 'auto', padding: '20px' }}>
                                <div className="particles"></div>
                                <div style={{display: 'flex', width: '100%', maxWidth: '600px', justifyContent: 'space-between', zIndex: 10, marginBottom: '20px'}}>
                                    <button className="glass-btn" onClick={() => setScreen('lider-dashboard')}><i className="fas fa-arrow-left"></i> Volver</button>
                                    <h2 style={{color: 'white', margin: 0}}><i className="fas fa-star" style={{color: 'var(--accent)'}}></i> Estrella</h2>
                                </div>

                                <div style={{zIndex: 10, background: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '15px', width: '100%', maxWidth: '600px', borderTop: `5px solid ${colorMap[liderLogueado.equipo]}`}}>
                                    {isBestCompleted ? (
                                        <div style={{textAlign: 'center', padding: '30px 0'}}>
                                            <i className="fas fa-check-circle" style={{fontSize: '4rem', color: '#2ecc71', marginBottom: '15px'}}></i>
                                            <h3 style={{color: 'white', margin: 0}}>¡Selección Completada!</h3>
                                            <p style={{color: 'var(--text-muted)'}}>El mejor campista ya fue guardado en el sistema.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <h2 style={{textAlign: 'center', margin: '0 0 20px 0', color: 'white', fontSize: '1.4rem'}}>
                                                ¿Quién es el mejor campista del equipo <span style={{color: colorMap[liderLogueado.equipo], textTransform: 'uppercase'}}>{liderLogueado.equipo}</span>?
                                            </h2>
                                            
                                            {myCampers.length === 0 ? (
                                                <p style={{textAlign: 'center', color: 'var(--accent)'}}>Aún no has registrado campistas.</p>
                                            ) : (
                                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px', marginBottom: '25px'}}>
                                                    {myCampers.map(c => {
                                                        const isSelected = selectedBestCamper?.id === c.id;
                                                        const borderColor = isSelected ? colorMap[liderLogueado.equipo] : '#8b4513'; 
                                                        const bgColor = isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(52, 73, 94, 0.5)'; 
                                                        return (
                                                            <div key={c.id} onClick={() => setSelectedBestCamper(c)} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px', borderRadius: '12px', border: `3px solid ${borderColor}`, background: bgColor, cursor: 'pointer', transition: '0.3s', transform: isSelected ? 'scale(1.05)' : 'scale(1)'}}>
                                                                <img src={c.fotoUrl} style={{width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px'}} alt="" />
                                                                <div style={{color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: '0.9rem'}}>{c.nombre}</div>
                                                                <div style={{color: 'var(--accent)', fontSize: '0.8rem'}}>#{c.numero || "?"}</div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}

                                            {selectedBestCamper && (
                                                <div style={{background: 'rgba(0,0,0,0.6)', padding: '20px', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--accent)', animation: 'fadeIn 0.3s ease-out'}}>
                                                    <p style={{color: 'white', margin: '0 0 15px 0', fontSize: '1.1rem'}}>¿Desea guardar a <strong>{selectedBestCamper.nombre}</strong> como su mejor campista?</p>
                                                    <button className="btn-start" disabled={isSubmittingBest} onClick={guardarMejorCampista} style={{margin: 0, justifyContent: 'center', width: '100%'}}>
                                                        {isSubmittingBest ? 'Guardando...' : <><i className="fas fa-save"></i> Guardar Registro</>}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </section>
                        );
                    })()}
                </>
            )}

            {/* =========================================
                VISTAS DEL PROYECTOR (STANDBY, HIMNO, SUBASTA)
                ========================================= */}
            {(screen === 'welcome' || screen === 'subasta-previa' || screen === 'subasta-activa') && (
                <section className="screen" id="welcome-screen" style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--dark-bg)', textAlign: 'center' }}>
                    <div className="particles"></div>
                    
                    {screen === 'welcome' && (
                        <div className="hero-content">
                            <div className="logo-container"><img src="/logo.png" alt="Logo" className="logo-img" /></div>
                            <div className="verse-box hide-on-mobile"><span>{verseText}</span><span className="cursor"></span></div>
                            <div style={{ marginTop: '10px' }}><h1 className="main-title">Mini Campamento<br /><span style={{ color: 'var(--accent)' }}>2026</span></h1></div>
                            
                            {role === 'control' ? (
                                <div style={{ display: 'flex', gap: '15px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    <button className="btn-start" onClick={() => setScreen('menu')}><i className="fas fa-music"></i> Himnario</button>
                                    <button className="btn-start" onClick={() => isAdminLogged ? setScreen('camp-admin') : setScreen('admin-login')}><i className="fas fa-campground"></i> Campamento</button>
                                    
                                    {/* BOTÓN PARA CERRAR SESIÓN DEL CONTROL */}
                                    <div style={{width: '100%', display: 'flex', justifyContent: 'center', marginTop: '15px'}}>
                                        <button className="glass-btn" onClick={handleDisconnect} style={{color: '#e74c3c', borderColor: '#e74c3c'}}>
                                            <i className="fas fa-sign-out-alt"></i> Salir de la Sala
                                        </button>
                                    </div>
                                </div>
                            ) : role === 'proyector' ? (
                                <div style={{ display: 'flex', gap: '15px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    {/* BOTÓN PARA CERRAR SESIÓN DEL PROYECTOR */}
                                    <button className="glass-btn" onClick={handleDisconnect} style={{color: '#e74c3c', borderColor: '#e74c3c', padding: '10px 20px', fontSize: '1rem'}}>
                                        <i className="fas fa-sign-out-alt"></i> Desconectar Proyector
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* VISTAS EXCLUSIVAS DEL PROYECTOR PARA LA SUBASTA */}
                    {screen === 'subasta-previa' && subastaActiveLot && (
                        <div style={{zIndex: 10, animation: 'fadeIn 0.5s', background: 'rgba(0,0,0,0.6)', padding: '50px', borderRadius: '30px', border: '2px solid var(--accent)', boxShadow: '0 0 50px rgba(255,215,0,0.3)', width: '80%', maxWidth: '800px'}}>
                            <h3 style={{color: 'var(--text-muted)', fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '5px', margin: '0 0 10px 0'}}>Lote de Subasta #{subastaActiveLot.numero}</h3>
                            <h1 style={{color: 'white', fontSize: '5rem', margin: '0 0 30px 0', textShadow: '0 5px 15px rgba(0,0,0,0.8)'}}>{subastaActiveLot.nombre}</h1>
                            <div style={{display: 'inline-block', background: 'rgba(255,215,0,0.1)', padding: '15px 40px', borderRadius: '50px', border: '1px solid var(--accent)'}}>
                                <span style={{color: 'var(--accent)', fontSize: '1.5rem', textTransform: 'uppercase'}}>Precio Base: </span>
                                <span style={{color: 'white', fontSize: '3rem', fontWeight: 'bold'}}>{subastaActiveLot.base} <i className="fas fa-coins" style={{color: '#ffd700'}}></i></span>
                            </div>
                        </div>
                    )}

                    {screen === 'subasta-activa' && subastaActiveLot && (
                        <div style={{zIndex: 10, animation: 'fadeIn 0.5s', width: '90%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                            <h2 style={{color: 'var(--accent)', fontSize: '3rem', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '4px', textShadow: '0 0 20px rgba(255,215,0,0.5)'}}>¡Lote en Juego!</h2>
                            
                            {subastaActiveLot.imageUrl && (
                                <img src={subastaActiveLot.imageUrl} style={{maxHeight: '40vh', objectFit: 'contain', borderRadius: '15px', border: '3px solid white', boxShadow: '0 10px 30px rgba(0,0,0,0.8)', marginBottom: '30px'}} alt="Reto" />
                            )}
                            
                            {!subastaActiveLot.imageUrl && (
                                <h1 style={{color: 'white', fontSize: '4rem', margin: '0 0 30px 0', textShadow: '0 5px 15px rgba(0,0,0,0.8)'}}>{subastaActiveLot.nombre}</h1>
                            )}

                            {subastaActiveLot.tiempoSecs > 0 && timerRemaining !== null && (
                                <div style={{background: timerRemaining <= 10 ? 'rgba(231, 76, 60, 0.2)' : 'rgba(0,0,0,0.6)', padding: '20px 60px', borderRadius: '30px', border: `3px solid ${timerRemaining <= 10 ? '#e74c3c' : 'var(--accent)'}`, boxShadow: `0 0 40px ${timerRemaining <= 10 ? 'rgba(231,76,60,0.5)' : 'rgba(255,215,0,0.3)'}`, transition: '0.3s'}}>
                                    <div style={{fontSize: '8rem', fontWeight: 'bold', color: timerRemaining <= 10 ? '#e74c3c' : 'white', fontFamily: 'monospace', textShadow: '0 5px 15px rgba(0,0,0,0.8)', lineHeight: 1}}>
                                        {Math.floor(timerRemaining / 60).toString().padStart(2, '0')}:{(timerRemaining % 60).toString().padStart(2, '0')}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{position: 'absolute', bottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', opacity: 0.8}}>
                        <span>Sala: {sessionCode}</span>
                        {role === 'control' && (
                            <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '10px'}}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: proyectorConectado ? '#2ecc71' : '#e74c3c', boxShadow: proyectorConectado ? '0 0 8px #2ecc71' : '0 0 8px #e74c3c', display: 'inline-block' }}></span>
                                <span>{proyectorConectado ? "Proyector Listo" : "Proyector Desconectado"}</span>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* =========================================
                VISTAS DEL ANFITRIÓN (PANEL DE CONTROL)
                ========================================= */}
            {screen === 'menu' && role === 'control' && (
                <section className="screen inner-screen">
                    <div className="particles"></div>
                    <img src="/logo.png" alt="Watermark" className="watermark-logo" />
                    <div className="modern-header">
                        <div className="header-row">
                            <button className="glass-btn" onClick={() => setScreen('welcome')}><i className="fas fa-arrow-left"></i> Inicio</button>
                            <h2>Himnarios</h2>
                            <div className="status-led-container"><span className={`led-dot ${proyectorConectado ? 'led-on' : 'led-off'}`}></span><span className="status-text">{proyectorConectado ? "LIVE" : "OFF"}</span></div>
                        </div>
                        <div className="search-container">
                            <i className="fas fa-search search-icon"></i>
                            <input type="text" inputMode="numeric" id="searchInput" placeholder="Buscar número o título..." onKeyDown={handleSearch} />
                            <button className="search-btn-inside" onClick={handleSearch}>Buscar</button>
                        </div>
                        <div className="book-tabs">
                            <button className={`tab-btn ${activeBook === 'evangelio' ? 'active' : ''}`} onClick={() => setActiveBook('evangelio')}>Evangélio</button>
                            <button className={`tab-btn ${activeBook === 'cantad' ? 'active' : ''}`} onClick={() => setActiveBook('cantad')}>Cantad Alegres</button>
                            <button className={`tab-btn ${activeBook === 'celebremos' ? 'active' : ''}`} onClick={() => setActiveBook('celebremos')}>Celebremos su Gloria</button>
                        </div>
                    </div>
                    <div className="grid-container">
                        <div className="cat-card" onClick={() => showRange(0, 100)}><i className="fas fa-music"></i><h3>0 - 100</h3></div>
                        <div className="cat-card" onClick={() => showRange(101, 200)}><i className="fas fa-guitar"></i><h3>101 - 200</h3></div>
                        <div className="cat-card" onClick={() => showRange(201, 300)}><i className="fas fa-drum"></i><h3>201 - 300</h3></div>
                        <div className="cat-card" onClick={() => showRange(301, 400)}><i className="fas fa-microphone-alt"></i><h3>301 - 400</h3></div>
                        <div className="cat-card" onClick={() => showRange(401, 566)}><i className="fas fa-users"></i><h3>401 - 566</h3></div>
                        <div className="cat-card" onClick={() => showRange(1, 49, "Coro")} style={{ borderColor: 'var(--accent)' }}><i className="fas fa-book-bible" style={{ color: 'var(--accent)' }}></i><h3 style={{ color: 'var(--text-main)' }}>COROS CLASE</h3></div>
                    </div>
                </section>
            )}

            {/* PANEL DE ADMINISTRACIÓN DEL CAMPAMENTO */}
            {screen === 'camp-admin' && role === 'control' && isAdminLogged && (
                <section className="screen camp-layout">
                    <div className="particles"></div>
                    
                    {/* BOTÓN HAMBURGUESA ANIMADO (TOGGLE ÚNICO PARA ABRIR/CERRAR EN MÓVILES) */}
                    <button
                        className={`menu-toggle-btn ${isMobileMenuOpen ? 'open' : ''}`}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>

                    <div className={`camp-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                        <div className="camp-sidebar-header">
                            <h2 style={{color: 'var(--accent)', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.2rem'}}>Campamento</h2>
                        </div>
                        <button className={`camp-nav-btn ${activeCampModule === 'dashboard' ? 'active' : ''}`} onClick={() => {setActiveCampModule('dashboard'); setIsMobileMenuOpen(false);}}><i className="fas fa-home"></i> Inicio</button>
                        <button className={`camp-nav-btn ${activeCampModule === 'maquinas' ? 'active' : ''}`} onClick={() => {setActiveCampModule('maquinas'); setIsMobileMenuOpen(false);}}><i className="fas fa-cogs"></i> Cuarto de Máquinas</button>
                        <button className={`camp-nav-btn ${activeCampModule === 'registro' ? 'active' : ''}`} onClick={() => {setActiveCampModule('registro'); setIsMobileMenuOpen(false);}}><i className="fas fa-user-plus"></i> Registro</button>
                        <button className={`camp-nav-btn ${activeCampModule === 'eval-verso' ? 'active' : ''}`} onClick={() => { setActiveCampModule('eval-verso'); setTeamVersoDetailMode(null); setIsMobileMenuOpen(false); }}><i className="fas fa-book-open"></i> Eval. Verso</button>
                        <button className={`camp-nav-btn ${activeCampModule === 'eval-coro' ? 'active' : ''}`} onClick={() => { setActiveCampModule('eval-coro'); setTeamCoroDetailMode(null); setIsMobileMenuOpen(false); }}><i className="fas fa-music"></i> Eval. Coro</button>
                        <button className={`camp-nav-btn ${activeCampModule === 'esgrima' ? 'active' : ''}`} onClick={() => {setActiveCampModule('esgrima'); setIsMobileMenuOpen(false);}}><i className="fas fa-scroll"></i> Esgrima Bíblico</button>
                        <button className={`camp-nav-btn ${activeCampModule === 'dinamicas' ? 'active' : ''}`} onClick={() => {setActiveCampModule('dinamicas'); setIsMobileMenuOpen(false);}}><i className="fas fa-running"></i> Dinámicas</button>
                        <button className={`camp-nav-btn ${activeCampModule === 'rescate' ? 'active' : ''}`} onClick={() => {setActiveCampModule('rescate'); setIsMobileMenuOpen(false);}}><i className="fas fa-life-ring"></i> Rescate de Puntos</button>
                        <button className={`camp-nav-btn ${activeCampModule === 'subasta' ? 'active' : ''}`} onClick={() => {setActiveCampModule('subasta'); setIsMobileMenuOpen(false);}}><i className="fas fa-gavel"></i> Liga Subasta</button>
                        <button className={`camp-nav-btn ${activeCampModule === 'mejores' ? 'active' : ''}`} onClick={() => {setActiveCampModule('mejores'); setIsMobileMenuOpen(false);}}><i className="fas fa-star"></i> Mejores Campistas</button>
                        <button className={`camp-nav-btn ${activeCampModule === 'videos' ? 'active' : ''}`} onClick={() => {setActiveCampModule('videos'); setIsMobileMenuOpen(false);}}><i className="fas fa-video"></i> Coros (Videos)</button>
                        <button className={`camp-nav-btn ${activeCampModule === 'ganador' ? 'active' : ''}`} onClick={() => {setActiveCampModule('ganador'); setIsMobileMenuOpen(false);}} style={{marginTop: '20px', borderTop: '1px solid rgba(255,215,0,0.3)', paddingTop: '15px', background: activeCampModule === 'ganador' ? 'rgba(255,215,0,0.2)' : 'rgba(255,215,0,0.05)', color: 'var(--accent)', fontWeight: 'bold'}}><i className="fas fa-trophy" style={{color: 'var(--accent)'}}></i> <span style={{color: 'var(--accent)'}}>Equipo Ganador</span></button>

                        <button className="glass-btn" style={{width: '100%', marginTop: '20px'}} onClick={() => { setScreen('welcome'); setIsMobileMenuOpen(false); }}><i className="fas fa-arrow-left"></i> Volver al Menú Inicio</button>
                    </div>

                    <div className="camp-main-content">
                        <img src="/logo.png" alt="Watermark" className="watermark-logo" style={{opacity: 0.03}} />
                        
                        {activeCampModule === 'dashboard' && (
                            <div className="camp-dashboard-view">
                                <img src="/logo.png" alt="Logo Campamento" className="camp-dashboard-logo" />
                                <h1 className="main-title" style={{fontSize: '3rem', margin: 0}}>Gestor de Campamento</h1>
                            </div>
                        )}

                        {/* =========================================
                            MÓDULO: EQUIPO GANADOR (LEADERBOARD)
                            ========================================= */}
                        {activeCampModule === 'ganador' && (
                            <div style={{zIndex: 10, paddingBottom: '50px'}}>
                                <h2 style={{ fontSize: '2.5rem', margin: '0 0 30px 0', textAlign: 'center', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '3px' }}><i className="fas fa-trophy"></i> Tabla General de Posiciones</h2>
                                
                                {/* GRÁFICO DE BARRAS GENERAL 3D */}
                                <div style={{background: 'rgba(0,0,0,0.5)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '40px'}}>
                                    {leaderboard.map((team, index) => (
                                        <div key={team.equipo} style={{marginBottom: '25px'}}>
                                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                                                <span style={{fontWeight: 'bold', fontSize: '1.2rem', color: colorMap[team.equipo], textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>{index + 1}. {team.equipo}</span>
                                                <span style={{fontWeight: 'bold', color: 'white', fontSize: '1.2rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>{team.total} pts</span>
                                            </div>
                                            <div className="progress-track">
                                                <div className="progress-fill" style={{ width: `${(team.total / maxTotalPoints) * 100}%`, background: `linear-gradient(90deg, rgba(0,0,0,0) 0%, ${colorMap[team.equipo]} 100%)`, boxShadow: `0 0 15px ${colorMap[team.equipo]}80` }}>
                                                    {team.total > 0 && <div className="progress-glow-orb" style={{boxShadow: `0 0 10px #fff, 0 0 20px ${colorMap[team.equipo]}`}}></div>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* TARJETAS DE DETALLE POR EQUIPO */}
                                {teamWinnerDetailMode ? (() => {
                                    const tStats = leaderboard.find(t => t.equipo === teamWinnerDetailMode);
                                    const maxSubTotal = Math.max(tStats.versoPts, tStats.coroPts, tStats.esgrimaPts, tStats.dinamicasPts, tStats.rescatePts, tStats.subastaPts, 1);
                                    
                                    return (
                                        <div style={{animation: 'fadeIn 0.4s'}}>
                                            <button className="glass-btn" onClick={() => setTeamWinnerDetailMode(null)} style={{marginBottom: '20px'}}><i className="fas fa-arrow-left"></i> Volver al Resumen</button>
                                            
                                            <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
                                                {/* Historial de Puntos */}
                                                <div style={{flex: 2, minWidth: '300px', background: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '15px', borderTop: `5px solid ${colorMap[teamWinnerDetailMode]}`}}>
                                                    <h3 style={{color: colorMap[teamWinnerDetailMode], marginTop: 0}}>Historial de Puntos: Equipo {teamWinnerDetailMode}</h3>
                                                    <div style={{maxHeight: '400px', overflowY: 'auto', paddingRight: '10px'}}>
                                                        {tStats.history.length === 0 ? <p style={{color: 'gray', fontStyle: 'italic'}}>Aún no hay puntos registrados.</p> : tStats.history.map((h, i) => (
                                                            <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '10px', marginBottom: '10px', borderLeft: `3px solid ${colorMap[teamWinnerDetailMode]}`}}>
                                                                <div>
                                                                    <div style={{color: 'white', fontWeight: 'bold'}}>{h.modulo}</div>
                                                                    <div style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>{h.detalle} (Por: {h.evaluador})</div>
                                                                </div>
                                                                <div style={{color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.2rem'}}>+{h.puntos} pts</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Mini Gráfico de Fortalezas */}
                                                <div style={{flex: 1, minWidth: '250px', background: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '15px', borderTop: `5px solid ${colorMap[teamWinnerDetailMode]}`}}>
                                                    <h3 style={{color: 'white', marginTop: 0}}>Fortalezas</h3>
                                                    <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px'}}>
                                                        {[
                                                            {label: 'Verso', val: tStats.versoPts},
                                                            {label: 'Coro', val: tStats.coroPts},
                                                            {label: 'Esgrima', val: tStats.esgrimaPts},
                                                            {label: 'Dinámicas', val: tStats.dinamicasPts},
                                                            {label: 'Rescate', val: tStats.rescatePts},
                                                            {label: 'Subasta', val: tStats.subastaPts}
                                                        ].map(item => (
                                                            <div key={item.label}>
                                                                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '5px', color: 'var(--text-muted)'}}>
                                                                    <span>{item.label}</span><span>{item.val} pts</span>
                                                                </div>
                                                                <div className="progress-track" style={{height: '15px', padding: '2px'}}>
                                                                    <div className="progress-fill" style={{ width: `${(item.val / maxSubTotal) * 100}%`, background: `linear-gradient(90deg, rgba(0,0,0,0) 0%, ${colorMap[teamWinnerDetailMode]} 100%)` }}></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })() : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                        {leaderboard.map(team => (
                                            <div key={team.equipo} onClick={() => setTeamWinnerDetailMode(team.equipo)} className="cat-card" style={{ background: 'rgba(255,255,255,0.03)', borderTop: `5px solid ${colorMap[team.equipo]}`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                <h3 style={{ color: colorMap[team.equipo], margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.5rem' }}>{team.equipo}</h3>
                                                <div style={{fontSize: '3rem', fontWeight: 'bold', color: 'white'}}>{team.total}</div>
                                                <div style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>pts totales</div>
                                                <div style={{color: 'var(--accent)', fontSize: '0.8rem', marginTop: '10px'}}>Ver historial completo <i className="fas fa-hand-pointer"></i></div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* =========================================
                            MÓDULO: CUARTO DE MÁQUINAS (Antes Lideres)
                            ========================================= */}
                        {activeCampModule === 'maquinas' && (
                            <div style={{zIndex: 10, paddingBottom: '50px'}}>
                                <h2 style={{ fontSize: '2.5rem', margin: '0 0 30px 0', color: 'var(--accent)' }}><i className="fas fa-cogs" style={{marginRight: '15px'}}></i>Cuarto de Máquinas</h2>
                                
                                {/* 1. GESTIÓN DE LÍDERES */}
                                <div style={{background: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '30px'}}>
                                    <h3 style={{color: 'white', margin: '0 0 15px 0'}}><i className="fas fa-user-tie"></i> 1. Gestión de Líderes</h3>
                                    <form onSubmit={handleLiderSubmit} style={{display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px'}}>
                                        <label style={{cursor: 'pointer'}}>
                                            {nuevoLider.fotoPreview ? <img src={nuevoLider.fotoPreview} style={{width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover'}} alt=""/> : <div style={{width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid gray'}}><i className="fas fa-camera"></i></div>}
                                            <input type="file" style={{display: 'none'}} accept="image/*" onChange={(e) => { if(e.target.files[0]) { setNuevoLider({...nuevoLider, fotoObj: e.target.files[0], fotoPreview: URL.createObjectURL(e.target.files[0])}) } }} />
                                        </label>
                                        <input type="text" placeholder="Nombre del Líder" value={nuevoLider.nombre} onChange={(e) => setNuevoLider({...nuevoLider, nombre: e.target.value})} style={{padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid gray', outline: 'none', minWidth: '200px', flex: 1}} />
                                        <select value={nuevoLider.equipo} onChange={(e) => setNuevoLider({...nuevoLider, equipo: e.target.value})} style={{padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid gray', outline: 'none'}}>
                                            <option value="">-- Asignar Equipo --</option>
                                            {EQUIPOS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                                        </select>
                                        <button type="submit" disabled={isSubmittingLider} className="btn-start" style={{margin: 0}}>{isSubmittingLider ? '...' : 'Crear Líder'}</button>
                                    </form>

                                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px'}}>
                                        {lideres.map(l => (
                                            <div key={l.id} style={{display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '10px', borderLeft: `5px solid ${colorMap[l.equipo]}`}}>
                                                <img src={l.fotoUrl} style={{width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover'}} alt=""/>
                                                <div><div style={{fontWeight: 'bold', fontSize: '0.9rem', color: 'white'}}>{l.nombre}</div><div style={{color: colorMap[l.equipo], fontSize: '0.7rem', textTransform: 'uppercase'}}>{l.equipo}</div></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 2. PANEL DE CONTROL DE ACTIVIDADES */}
                                <div style={{background: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '30px'}}>
                                    <h3 style={{color: 'white', margin: '0 0 5px 0'}}><i className="fas fa-toggle-on"></i> 2. Activación de Actividades</h3>
                                    <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px'}}>Habilita los módulos en los celulares de los líderes.</p>
                                    
                                    <div style={{marginBottom: '20px'}}>
                                        <h4 style={{color: 'var(--accent)', margin: '0 0 10px 0'}}>Eval. Verso</h4>
                                        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                                            {EQUIPOS.map(eq => {
                                                const status = actividades?.['eval-verso']?.[eq] || 'offline';
                                                const statusColor = status === 'online' ? '#2ecc71' : status === 'completado' ? '#ffd700' : '#e74c3c';
                                                return (
                                                    <button key={eq} onClick={() => toggleActividad('eval-verso', eq, status)} className="glass-btn" style={{borderColor: statusColor}}>
                                                        <span style={{width: '10px', height: '10px', borderRadius: '50%', background: statusColor, boxShadow: `0 0 8px ${statusColor}`}}></span> {eq}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 style={{color: 'var(--accent)', margin: '0 0 10px 0'}}>Mejores Campistas</h4>
                                        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                                            {EQUIPOS.map(eq => {
                                                const status = actividades?.['mejores']?.[eq] || 'offline';
                                                const statusColor = status === 'online' ? '#2ecc71' : status === 'completado' ? '#ffd700' : '#e74c3c';
                                                return (
                                                    <button key={eq} onClick={() => toggleActividad('mejores', eq, status)} className="glass-btn" style={{borderColor: statusColor}}>
                                                        <span style={{width: '10px', height: '10px', borderRadius: '50%', background: statusColor, boxShadow: `0 0 8px ${statusColor}`}}></span> {eq}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* 3. TORRE DE CONTROL DE ESGRIMA */}
                                <div style={{background: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '30px'}}>
                                    <h3 style={{color: 'white', margin: '0 0 5px 0'}}><i className="fas fa-scroll"></i> 3. Banco de Preguntas (Esgrima)</h3>
                                    <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px'}}>Crea las preguntas que se usarán durante la Rueda de Preguntas.</p>
                                    
                                    <form onSubmit={handleCrearPreguntaEsgrima} style={{display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px'}}>
                                        <input type="text" placeholder="Escribe la pregunta bíblica..." value={nuevaPreguntaTexto} onChange={(e) => setNuevaPreguntaTexto(e.target.value)} style={{flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid gray', outline: 'none'}} />
                                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                            <span style={{color: 'var(--text-muted)'}}>Puntos:</span>
                                            <input type="number" min="1" value={nuevaPreguntaPuntos} onChange={(e) => setNuevaPreguntaPuntos(parseInt(e.target.value) || 0)} style={{width: '80px', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'var(--accent)', fontWeight: 'bold', border: '1px solid var(--accent)', outline: 'none', textAlign: 'center'}} />
                                        </div>
                                        <button type="submit" disabled={isSubmittingPregunta} className="btn-start" style={{margin: 0}}>{isSubmittingPregunta ? '...' : 'Añadir Pregunta'}</button>
                                    </form>

                                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                                        {esgrimaPreguntasDB.map((p, i) => (
                                            <div key={p.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '10px', borderLeft: '4px solid var(--accent)'}}>
                                                <div style={{color: 'white'}}><strong>{i + 1}.</strong> {p.texto}</div>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                                                    <span style={{color: 'var(--accent)', fontWeight: 'bold'}}>{p.puntos} pts</span>
                                                    <button className="glass-btn" style={{padding: '5px 10px', color: '#e74c3c', borderColor: 'transparent'}} onClick={() => eliminarPreguntaEsgrima(p.id)}><i className="fas fa-trash"></i></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 4. TORRE DE CONTROL DE DINÁMICAS */}
                                <div style={{background: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '30px'}}>
                                    <h3 style={{color: 'white', margin: '0 0 5px 0'}}><i className="fas fa-running"></i> 4. Gestor de Dinámicas</h3>
                                    <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px'}}>Crea los juegos o actividades extra para que compitan los equipos.</p>
                                    
                                    <form onSubmit={handleCrearDinamica} style={{display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px'}}>
                                        <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
                                            <input type="text" placeholder="Nombre de la Dinámica" value={nuevaDinamica.nombre} onChange={(e) => setNuevaDinamica({...nuevaDinamica, nombre: e.target.value})} style={{flex: 1, minWidth: '200px', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid gray', outline: 'none'}} />
                                            <input type="number" placeholder="Puntos" min="1" value={nuevaDinamica.puntos} onChange={(e) => setNuevaDinamica({...nuevaDinamica, puntos: parseInt(e.target.value) || 0})} style={{width: '100px', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'var(--accent)', fontWeight: 'bold', border: '1px solid var(--accent)', outline: 'none', textAlign: 'center'}} />
                                            <select value={nuevaDinamica.ganadoresValidos} onChange={(e) => setNuevaDinamica({...nuevaDinamica, ganadoresValidos: e.target.value})} style={{padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid gray', outline: 'none'}}>
                                                <option value="1">Gana 1 Equipo</option>
                                                <option value="2">Ganan 2 Equipos</option>
                                            </select>
                                        </div>
                                        <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                                            <input type="text" placeholder="Detalles o descripción (Ej. Pasarse la chimbomba)" value={nuevaDinamica.detalles} onChange={(e) => setNuevaDinamica({...nuevaDinamica, detalles: e.target.value})} style={{flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid gray', outline: 'none'}} />
                                            <button type="submit" disabled={isSubmittingDinamica} className="btn-start" style={{margin: 0}}>{isSubmittingDinamica ? '...' : 'Añadir Dinámica'}</button>
                                        </div>
                                    </form>

                                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                                        {dinamicasDB.map((d, i) => (
                                            <div key={d.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '10px', borderLeft: '4px solid var(--accent)'}}>
                                                <div style={{color: 'white'}}>
                                                    <strong>{i + 1}. {d.nombre}</strong> <span style={{color: 'gray', fontSize: '0.8rem'}}>({d.ganadoresValidos} ganador/es)</span>
                                                    <div style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>{d.detalles}</div>
                                                </div>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                                                    <span style={{color: 'var(--accent)', fontWeight: 'bold'}}>{d.puntos} pts</span>
                                                    <button className="glass-btn" style={{padding: '5px 10px', color: '#e74c3c', borderColor: 'transparent'}} onClick={() => eliminarDinamica(d.id)}><i className="fas fa-trash"></i></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 5. TORRE DE CONTROL DE RESCATE DE PUNTOS */}
                                <div style={{background: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '40px'}}>
                                    <h3 style={{color: 'white', margin: '0 0 5px 0'}}><i className="fas fa-life-ring"></i> 5. Gestor de Rescate de Puntos</h3>
                                    <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px'}}>Crea las preguntas de rescate basadas en las predicaciones.</p>
                                    
                                    <form onSubmit={handleCrearRescate} style={{display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px'}}>
                                        <input type="text" placeholder="Escribe la pregunta de rescate..." value={nuevoRescateTexto} onChange={(e) => setNuevoRescateTexto(e.target.value)} style={{flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid gray', outline: 'none'}} />
                                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                            <span style={{color: 'var(--text-muted)'}}>Puntos:</span>
                                            <input type="number" min="1" value={nuevoRescatePuntos} onChange={(e) => setNuevoRescatePuntos(parseInt(e.target.value) || 0)} style={{width: '80px', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'var(--accent)', fontWeight: 'bold', border: '1px solid var(--accent)', outline: 'none', textAlign: 'center'}} />
                                        </div>
                                        <button type="submit" disabled={isSubmittingRescate} className="btn-start" style={{margin: 0}}>{isSubmittingRescate ? '...' : 'Añadir Rescate'}</button>
                                    </form>

                                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                                        {rescateDB.map((r, i) => (
                                            <div key={r.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '10px', borderLeft: '4px solid var(--accent)'}}>
                                                <div style={{color: 'white'}}><strong>{i + 1}.</strong> {r.texto}</div>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                                                    <span style={{color: 'var(--accent)', fontWeight: 'bold'}}>{r.puntos} pts</span>
                                                    <button className="glass-btn" style={{padding: '5px 10px', color: '#e74c3c', borderColor: 'transparent'}} onClick={() => eliminarRescate(r.id)}><i className="fas fa-trash"></i></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 6. CREADOR DE LOTES DE SUBASTA */}
                                <div style={{background: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '40px'}}>
                                    <h3 style={{color: 'white', margin: '0 0 5px 0'}}><i className="fas fa-gavel"></i> 6. Creador de Lotes de Subasta</h3>
                                    <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px'}}>Configura los lotes que se venderán en la Liga de Subasta. Opcionalmente añade límite de tiempo e imagen para el proyector.</p>
                                    
                                    <form onSubmit={handleCrearLoteSubasta} style={{display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px'}}>
                                        <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
                                            <input type="number" placeholder="Lote #" min="1" value={nuevoLote.numero} onChange={(e) => setNuevoLote({...nuevoLote, numero: e.target.value})} style={{width: '80px', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid gray', outline: 'none', textAlign: 'center'}} required />
                                            <input type="text" placeholder="Nombre del Lote (Ej. El Código Secreto)" value={nuevoLote.nombre} onChange={(e) => setNuevoLote({...nuevoLote, nombre: e.target.value})} style={{flex: 1, minWidth: '200px', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid gray', outline: 'none'}} required />
                                            <select value={nuevoLote.riesgo} onChange={(e) => setNuevoLote({...nuevoLote, riesgo: e.target.value})} style={{padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid gray', outline: 'none'}}>
                                                <option value="Fácil">Fácil</option><option value="Medio">Medio</option><option value="Difícil">Difícil</option><option value="Riesgo">Riesgo / Especial</option>
                                            </select>
                                        </div>

                                        <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: '8px', border: '1px solid gray'}}>
                                                <span style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>Precio Base:</span>
                                                <input type="number" min="0" step="50" value={nuevoLote.base} onChange={(e) => setNuevoLote({...nuevoLote, base: e.target.value})} style={{width: '80px', padding: '8px', borderRadius: '5px', background: 'transparent', color: '#ffd700', fontWeight: 'bold', border: 'none', outline: 'none'}} required />
                                                <i className="fas fa-coins" style={{color: '#ffd700'}}></i>
                                            </div>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: '8px', border: '1px solid var(--accent)'}}>
                                                <span style={{color: 'white', fontSize: '0.9rem'}}>Premio:</span>
                                                <input type="number" min="0" step="10" value={nuevoLote.premioPV} onChange={(e) => setNuevoLote({...nuevoLote, premioPV: e.target.value})} style={{width: '80px', padding: '8px', borderRadius: '5px', background: 'transparent', color: 'var(--accent)', fontWeight: 'bold', border: 'none', outline: 'none'}} required />
                                                <span style={{color: 'var(--accent)', fontWeight: 'bold'}}>PV</span>
                                            </div>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: '8px', border: '1px solid gray'}}>
                                                <i className="fas fa-stopwatch" style={{color: 'white'}}></i>
                                                <input type="number" min="0" placeholder="0 = Sin límite" value={nuevoLote.tiempoSecs} onChange={(e) => setNuevoLote({...nuevoLote, tiempoSecs: e.target.value})} style={{width: '120px', padding: '8px', borderRadius: '5px', background: 'transparent', color: 'white', border: 'none', outline: 'none'}} />
                                                <span style={{color: 'var(--text-muted)', fontSize: '0.8rem'}}>Segundos</span>
                                            </div>
                                        </div>

                                        <div style={{display: 'flex', gap: '15px', alignItems: 'flex-start'}}>
                                            <textarea placeholder="Detalle del reto (Instrucciones para el moderador)" value={nuevoLote.detalle} onChange={(e) => setNuevoLote({...nuevoLote, detalle: e.target.value})} style={{flex: 1, padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid gray', outline: 'none', minHeight: '80px', resize: 'vertical'}} required></textarea>
                                            
                                            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'}}>
                                                <label className="glass-btn" style={{cursor: 'pointer', margin: 0, padding: '10px', textAlign: 'center'}}>
                                                    <i className="fas fa-image"></i> {nuevoLote.fotoObj ? 'Imagen Lista' : 'Subir Imagen (Proyector)'}
                                                    <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => { if(e.target.files[0]) { setNuevoLote({...nuevoLote, fotoObj: e.target.files[0], fotoPreview: URL.createObjectURL(e.target.files[0])}) } }} />
                                                </label>
                                                {nuevoLote.fotoPreview && <img src={nuevoLote.fotoPreview} style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px'}} alt="Preview" />}
                                            </div>
                                        </div>

                                        <button type="submit" disabled={isSubmittingLote} className="btn-start" style={{justifyContent: 'center'}}>{isSubmittingLote ? 'Guardando Lote...' : <><i className="fas fa-plus-circle"></i> Añadir Lote al Catálogo</>}</button>
                                    </form>

                                    {/* LISTA DE LOTES CREADOS */}
                                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px'}}>
                                        {subastaLotesDB.map((l) => (
                                            <div key={l.id} style={{background: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '10px', borderLeft: `4px solid ${l.riesgo === 'Fácil' ? '#2ecc71' : l.riesgo === 'Medio' ? '#f39c12' : l.riesgo === 'Difícil' ? '#e74c3c' : '#9b59b6'}`}}>
                                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px'}}>
                                                    <h4 style={{margin: 0, color: 'white'}}>Lote #{l.numero}: {l.nombre}</h4>
                                                    <button className="glass-btn" style={{padding: '5px', color: '#e74c3c', borderColor: 'transparent', margin: 0}} onClick={() => eliminarLoteSubasta(l.id)}><i className="fas fa-trash"></i></button>
                                                </div>
                                                <div className="lote-detalle-text" style={{color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '10px'}}>{l.detalle}</div>
                                                <div style={{display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '0.85rem', fontWeight: 'bold'}}>
                                                    <span style={{color: '#ffd700'}}><i className="fas fa-coins"></i> Base: {l.base}</span>
                                                    <span style={{color: 'var(--accent)'}}><i className="fas fa-star"></i> Premio: {l.premioPV} PV</span>
                                                    {l.tiempoSecs > 0 && <span style={{color: 'white'}}><i className="fas fa-stopwatch"></i> {l.tiempoSecs}s</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* BOTÓN DE PÁNICO: RESET FACTORY */}
                                <div style={{borderTop: '1px solid rgba(255,0,0,0.3)', paddingTop: '30px', textAlign: 'center'}}>
                                    <button className="btn-start" style={{background: 'rgba(231, 76, 60, 0.1)', borderColor: '#e74c3c', color: '#e74c3c'}} onClick={() => setShowWipeModal(true)}>
                                        <i className="fas fa-skull-crossbones"></i> BORRAR TODA LA BASE DE DATOS
                                    </button>
                                    <p style={{color: 'gray', fontSize: '0.8rem', marginTop: '10px'}}>Utiliza esto solo antes del evento para limpiar los datos de prueba.</p>
                                </div>
                            </div>
                        )}

                        {/* MÓDULO: REGISTRO DE CAMPISTAS */}
                        {activeCampModule === 'registro' && (
                            <div style={{zIndex: 10}}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h2 style={{ fontSize: '2rem', margin: 0 }}><i className="fas fa-users" style={{color: 'var(--accent)', marginRight: '10px'}}></i>Equipos ({campistas.length})</h2>
                                    {teamDetailMode ? (
                                        <button className="glass-btn" onClick={() => setTeamDetailMode(null)}><i className="fas fa-arrow-left"></i> Volver a Equipos</button>
                                    ) : (
                                        <button className="btn-start" style={{margin: 0, padding: '8px 20px', fontSize: '0.9rem'}} onClick={() => openLinkModal(`${window.location.origin}/?modo=lider`, 'Enlace de Líderes')}><i className="fas fa-link"></i> Link Accesos</button>
                                    )}
                                </div>
                                {teamDetailMode ? (
                                    <div>
                                        <h3 style={{color: colorMap[teamDetailMode], borderBottom: `2px solid ${colorMap[teamDetailMode]}`, paddingBottom: '10px', textTransform: 'uppercase', letterSpacing: '2px'}}>Integrantes: {teamDetailMode}</h3>
                                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px', marginTop: '20px'}}>
                                            {campistas.filter(c => c.equipo === teamDetailMode).map(c => (
                                                <div key={c.id} className="camper-detail-card" style={{borderTop: `4px solid ${colorMap[teamDetailMode]}`}}>
                                                    <img src={c.fotoUrl} alt={c.nombre} style={{borderColor: colorMap[teamDetailMode]}} />
                                                    <div style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{c.nombre}</div>
                                                    <div style={{color: 'var(--accent)', margin: '5px 0', fontSize: '1.2rem', fontWeight: 'bold'}}>#{c.numero || "?"}</div>
                                                    <div style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>{c.edad} años</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                                        {EQUIPOS.map(equipo => {
                                            const teamColor = colorMap[equipo];
                                            const teamCampers = campistas.filter(c => c.equipo === equipo);
                                            const tieneLider = lideres.some(l => l.equipo === equipo);
                                            return (
                                                <div key={equipo} onClick={() => tieneLider && teamCampers.length > 0 && setTeamDetailMode(equipo)} style={{ background: 'rgba(255,255,255,0.03)', borderTop: `5px solid ${teamColor}`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', cursor: (tieneLider && teamCampers.length > 0) ? 'pointer' : 'default', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', transition: '0.3s' }} className={(tieneLider && teamCampers.length > 0) ? "cat-card" : ""}>
                                                    <h3 style={{ color: teamColor, margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.5rem' }}>{equipo}</h3>
                                                    {tieneLider ? <div style={{fontSize: '3rem', fontWeight: 'bold', color: 'white'}}>{teamCampers.length}</div> : <div style={{color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center'}}>Requiere crear un líder primero</div>}
                                                    {tieneLider && teamCampers.length > 0 && <div style={{color: 'var(--accent)', fontSize: '0.8rem'}}>Tocar para ver detalles <i className="fas fa-hand-pointer"></i></div>}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* MÓDULO: EVALUACIÓN DE VERSO */}
                        {activeCampModule === 'eval-verso' && (
                            <div style={{zIndex: 10}}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h2 style={{ fontSize: '2rem', margin: 0 }}><i className="fas fa-book-open" style={{color: 'var(--accent)', marginRight: '10px'}}></i>Evaluación de Verso</h2>
                                    {teamVersoDetailMode && (
                                        <button className="glass-btn" onClick={() => setTeamVersoDetailMode(null)}><i className="fas fa-arrow-left"></i> Volver a Equipos</button>
                                    )}
                                </div>

                                {teamVersoDetailMode ? (() => {
                                    const teamCampers = campistas.filter(c => c.equipo === teamVersoDetailMode);
                                    const evalData = evaluacionesVerso.find(e => e.id === teamVersoDetailMode);
                                    const maxPuntos = teamCampers.length * 10;
                                    let puntosGanados = 0;
                                    if (evalData && evalData.scores) { teamCampers.forEach(c => { puntosGanados += evalData.scores[c.id] || 0; }); }
                                    const notaFinal = maxPuntos > 0 ? ((puntosGanados / maxPuntos) * 100).toFixed(1) : 0;

                                    return (
                                        <div>
                                            <h3 style={{color: colorMap[teamVersoDetailMode], borderBottom: `2px solid ${colorMap[teamVersoDetailMode]}`, paddingBottom: '10px', textTransform: 'uppercase', letterSpacing: '2px'}}>Detalle Equipo {teamVersoDetailMode}</h3>
                                            
                                            <div style={{display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px'}}>
                                                {teamCampers.map(c => (
                                                    <div key={c.id} style={{display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '12px', borderLeft: `5px solid ${colorMap[teamVersoDetailMode]}`, width: '280px'}}>
                                                        <img src={c.fotoUrl} style={{width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover'}} alt=""/>
                                                        <div style={{flex: 1}}>
                                                            <div style={{fontWeight: 'bold', fontSize: '1rem', color: 'white'}}>#{c.numero || "?"} {c.nombre}</div>
                                                            <div style={{color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.2rem'}}>{evalData?.scores?.[c.id] || 0} / 10 pts</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div style={{marginTop: '30px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '15px', textAlign: 'center', border: '1px solid var(--accent)'}}>
                                                <h3 style={{color: 'white', margin: '0 0 10px 0'}}>Cálculo Final (Ponderado a 100)</h3>
                                                <div style={{fontSize: '1.2rem', color: 'var(--text-muted)'}}>({puntosGanados} pts obtenidos / {maxPuntos} pts posibles) * 100 =</div>
                                                <div style={{fontSize: '4rem', fontWeight: 'bold', color: 'var(--accent)', marginTop: '10px'}}>{notaFinal} pts</div>
                                            </div>
                                        </div>
                                    );
                                })() : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                                        {EQUIPOS.map(equipo => {
                                            const teamColor = colorMap[equipo];
                                            const teamCampers = campistas.filter(c => c.equipo === equipo);
                                            const evalData = evaluacionesVerso.find(e => e.id === equipo);
                                            
                                            let notaFinal = 0;
                                            if (evalData && evalData.scores && teamCampers.length > 0) {
                                                const maxPuntos = teamCampers.length * 10;
                                                let puntosGanados = 0;
                                                teamCampers.forEach(c => { puntosGanados += evalData.scores[c.id] || 0; });
                                                notaFinal = ((puntosGanados / maxPuntos) * 100).toFixed(1);
                                            }

                                            return (
                                                <div key={equipo} onClick={() => evalData && setTeamVersoDetailMode(equipo)} style={{ background: 'rgba(255,255,255,0.03)', borderTop: `5px solid ${teamColor}`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', cursor: evalData ? 'pointer' : 'default', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', transition: '0.3s' }} className={evalData ? "cat-card" : ""}>
                                                    <h3 style={{ color: teamColor, margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.5rem' }}>{equipo}</h3>
                                                    {evalData ? (
                                                        <>
                                                            <div style={{fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent)'}}>{notaFinal}</div>
                                                            <div style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>pts ponderados</div>
                                                            <div style={{color: 'var(--accent)', fontSize: '0.8rem', marginTop: '10px'}}>Ver detalle de notas <i className="fas fa-hand-pointer"></i></div>
                                                        </>
                                                    ) : <div style={{color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: '20px 0'}}>Esperando evaluación...</div>}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* MÓDULO: EVALUACIÓN DE CORO */}
                        {activeCampModule === 'eval-coro' && (
                            <div style={{zIndex: 10}}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h2 style={{ fontSize: '2rem', margin: 0 }}><i className="fas fa-music" style={{color: 'var(--accent)', marginRight: '10px'}}></i>Evaluación de Coro</h2>
                                    {teamCoroDetailMode ? (
                                        <button className="glass-btn" onClick={() => setTeamCoroDetailMode(null)}><i className="fas fa-arrow-left"></i> Volver a Equipos</button>
                                    ) : (
                                        <button className="btn-start" style={{margin: 0, padding: '8px 20px', fontSize: '0.9rem'}} onClick={() => openLinkModal(`${window.location.origin}/?modo=juez`, 'Enlace para Jueces')}><i className="fas fa-link"></i> Link Jueces</button>
                                    )}
                                </div>

                                {teamCoroDetailMode ? (() => {
                                    const teamEvals = evaluacionesCoro.filter(e => e.equipos && e.equipos.includes(teamCoroDetailMode));
                                    let sumaTotales = 0;
                                    teamEvals.forEach(e => sumaTotales += e.total);
                                    const promedio = teamEvals.length > 0 ? (sumaTotales / teamEvals.length).toFixed(1) : 0;
                                    const notaFinal = teamEvals.length > 0 ? (promedio / 2).toFixed(1) : 0;

                                    return (
                                        <div>
                                            <h3 style={{color: colorMap[teamCoroDetailMode], borderBottom: `2px solid ${colorMap[teamCoroDetailMode]}`, paddingBottom: '10px', textTransform: 'uppercase', letterSpacing: '2px'}}>Detalle Evaluaciones: Equipo {teamCoroDetailMode}</h3>
                                            
                                            <div className="table-responsive-container" style={{marginTop: '20px', overflowX: 'auto'}}>
                                                <table style={{width: '100%', borderCollapse: 'collapse', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', overflow: 'hidden'}}>
                                                    <thead>
                                                        <tr style={{background: 'rgba(255,255,255,0.1)', color: 'var(--accent)', textAlign: 'left'}}>
                                                            <th style={{padding: '15px'}}>Jurado</th>
                                                            <th style={{padding: '15px'}}>Ritmo (30)</th>
                                                            <th style={{padding: '15px'}}>Volumen (30)</th>
                                                            <th style={{padding: '15px'}}>Coordinación (40)</th>
                                                            <th style={{padding: '15px', fontWeight: 'bold'}}>Total (100)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {teamEvals.map(e => (
                                                            <tr key={e.id} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                                                                <td style={{padding: '15px', color: 'white'}}>{e.juezNombre}</td>
                                                                <td style={{padding: '15px', color: 'white'}}>{e.ritmo} pts</td>
                                                                <td style={{padding: '15px', color: 'white'}}>{e.volumen} pts</td>
                                                                <td style={{padding: '15px', color: 'white'}}>{e.coordinacion} pts</td>
                                                                <td style={{padding: '15px', color: 'var(--accent)', fontWeight: 'bold'}}>{e.total} pts</td>
                                                            </tr>
                                                        ))}
                                                        {teamEvals.length === 0 && (
                                                            <tr><td colSpan="5" style={{padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic'}}>Aún no hay evaluaciones registradas para este equipo.</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {teamEvals.length > 0 && (
                                                <div style={{marginTop: '30px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '15px', textAlign: 'center', border: '1px solid var(--accent)'}}>
                                                    <h3 style={{color: 'white', margin: '0 0 10px 0'}}>Cálculo Ponderado Final</h3>
                                                    <div style={{fontSize: '1.1rem', color: 'var(--text-muted)'}}>Sumatoria Total de Jueces: <strong style={{color: 'white'}}>{sumaTotales} pts</strong></div>
                                                    <div style={{fontSize: '1.1rem', color: 'var(--text-muted)', marginTop: '5px'}}>Promedio ({sumaTotales} / {teamEvals.length} jueces): <strong style={{color: 'white'}}>{promedio} pts</strong></div>
                                                    <div style={{fontSize: '1.2rem', color: 'white', marginTop: '15px'}}>Ponderación sobre 50 pts (Promedio / 2)</div>
                                                    <div style={{fontSize: '4rem', fontWeight: 'bold', color: 'var(--accent)', marginTop: '10px'}}>{notaFinal} pts</div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })() : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                                        {EQUIPOS.map(equipo => {
                                            const teamColor = colorMap[equipo];
                                            const teamEvals = evaluacionesCoro.filter(e => e.equipos && e.equipos.includes(equipo));
                                            
                                            let notaFinal = 0;
                                            if (teamEvals.length > 0) {
                                                let sumaTotales = 0;
                                                teamEvals.forEach(e => sumaTotales += e.total);
                                                notaFinal = ((sumaTotales / teamEvals.length) / 2).toFixed(1);
                                            }

                                            return (
                                                <div key={equipo} onClick={() => teamEvals.length > 0 && setTeamCoroDetailMode(equipo)} style={{ background: 'rgba(255,255,255,0.03)', borderTop: `5px solid ${teamColor}`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', cursor: teamEvals.length > 0 ? 'pointer' : 'default', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', transition: '0.3s' }} className={teamEvals.length > 0 ? "cat-card" : ""}>
                                                    <h3 style={{ color: teamColor, margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.5rem' }}>{equipo}</h3>
                                                    {teamEvals.length > 0 ? (
                                                        <>
                                                            <div style={{fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent)'}}>{notaFinal}</div>
                                                            <div style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>pts ponderados</div>
                                                            <div style={{color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '5px'}}>({teamEvals.length} evaluaciones)</div>
                                                            <div style={{color: 'var(--accent)', fontSize: '0.8rem', marginTop: '10px'}}>Ver detalle de jurados <i className="fas fa-hand-pointer"></i></div>
                                                        </>
                                                    ) : <div style={{color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: '20px 0'}}>Esperando evaluación de jurado...</div>}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* MÓDULO: ESGRIMA BÍBLICO */}
                        {activeCampModule === 'esgrima' && (
                            <div style={{zIndex: 10}}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h2 style={{ fontSize: '2rem', margin: 0 }}><i className="fas fa-scroll" style={{color: 'var(--accent)', marginRight: '10px'}}></i>Esgrima Bíblico</h2>
                                </div>

                                {/* SECCIÓN 1: ACTIVIDADES ESPECIALES (Las 3 Cuadrículas) */}
                                <div style={{marginBottom: '40px'}}>
                                    <h3 style={{color: 'white', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px'}}>1. Actividades de Habilidad (Inicio, Medio, Final)</h3>
                                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '15px'}}>
                                        {[1, 2, 3].map(num => {
                                            const isSaved = esgrimaActividadesDB[`act${num}`];
                                            const st = actsLocal[num];
                                            
                                            if (isSaved) {
                                                return (
                                                    <div key={num} style={{background: 'rgba(255,255,255,0.05)', borderRadius: '15px', padding: '20px', borderTop: `4px solid ${colorMap[isSaved.ganadorDinámica]}`}}>
                                                        <h4 style={{margin: '0 0 15px 0', color: 'var(--accent)', textAlign: 'center'}}>Actividad #{num} (Completada)</h4>
                                                        <p style={{color: 'white', fontSize: '0.9rem'}}><strong>Ganador Dinámica (+2 pts):</strong> <span style={{color: colorMap[isSaved.ganadorDinámica]}}>{isSaved.ganadorDinámica}</span></p>
                                                        <p style={{color: 'white', fontSize: '0.9rem'}}><strong>Respondió Pregunta (+5 pts):</strong> {isSaved.contestoPregunta ? <span style={{color: '#2ecc71'}}>Sí</span> : <span style={{color: '#e74c3c'}}>No</span>}</p>
                                                        {!isSaved.contestoPregunta && (
                                                            <p style={{color: 'white', fontSize: '0.9rem'}}><strong>Rebote (+5 pts):</strong> <span style={{color: colorMap[isSaved.equipoRebote]}}>{isSaved.equipoRebote}</span></p>
                                                        )}
                                                    </div>
                                                )
                                            }

                                            return (
                                                <div key={num} style={{background: 'rgba(0,0,0,0.4)', borderRadius: '15px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)'}}>
                                                    <h4 style={{margin: '0 0 15px 0', color: 'white', textAlign: 'center'}}>Actividad #{num}</h4>
                                                    
                                                    <div style={{marginBottom: '15px'}}>
                                                        <label style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>¿Qué equipo ganó la dinámica? (+2 pts)</label>
                                                        <div style={{display: 'flex', gap: '5px', marginTop: '5px', flexWrap: 'wrap'}}>
                                                            {EQUIPOS.map(eq => (
                                                                <button key={eq} className="glass-btn" style={{flex: 1, minWidth: '40%', padding: '8px', fontSize: '0.8rem', background: st.ganador === eq ? colorMap[eq] : '', color: st.ganador === eq ? 'black' : 'white', borderColor: st.ganador === eq ? colorMap[eq] : ''}} onClick={() => setActsLocal({...actsLocal, [num]: {...st, ganador: eq}})}>
                                                                    {eq}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {st.ganador && (
                                                        <div style={{marginBottom: '15px', animation: 'fadeIn 0.3s'}}>
                                                            <label style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>¿Contestó la pregunta? (+5 pts)</label>
                                                            <div style={{display: 'flex', gap: '10px', marginTop: '5px'}}>
                                                                <button className="glass-btn" style={{flex: 1, background: st.contesto === true ? '#2ecc71' : '', color: st.contesto === true ? 'black' : 'white'}} onClick={() => setActsLocal({...actsLocal, [num]: {...st, contesto: true, rebote: ''}})}>Sí</button>
                                                                <button className="glass-btn" style={{flex: 1, background: st.contesto === false ? '#e74c3c' : '', color: st.contesto === false ? 'white' : 'white'}} onClick={() => setActsLocal({...actsLocal, [num]: {...st, contesto: false}})}>No</button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {st.contesto === false && (
                                                        <div style={{marginBottom: '15px', animation: 'fadeIn 0.3s'}}>
                                                            <label style={{color: 'var(--accent)', fontSize: '0.9rem'}}>REBOTE: ¿Qué equipo la contestó? (+5 pts)</label>
                                                            <div style={{display: 'flex', gap: '5px', marginTop: '5px', flexWrap: 'wrap'}}>
                                                                {EQUIPOS.filter(e => e !== st.ganador).map(eq => (
                                                                    <button key={eq} className="glass-btn" style={{flex: 1, minWidth: '40%', padding: '8px', fontSize: '0.8rem', background: st.rebote === eq ? colorMap[eq] : '', color: st.rebote === eq ? 'black' : 'white'}} onClick={() => setActsLocal({...actsLocal, [num]: {...st, rebote: eq}})}>
                                                                        {eq}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <button className="btn-start" style={{width: '100%', padding: '10px', fontSize: '0.9rem', justifyContent: 'center'}} onClick={() => guardarActividadEsgrima(num)}>
                                                        <i className="fas fa-save"></i> Guardar Actividad
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* SECCIÓN 2: RUEDA DE PREGUNTAS (Banco Creado) */}
                                <div style={{marginBottom: '40px'}}>
                                    <h3 style={{color: 'white', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px'}}>2. Rueda de Preguntas ({esgrimaPreguntasDB.length})</h3>
                                    
                                    {esgrimaResultadosDB.guardadoFinal ? (
                                        <div style={{textAlign: 'center', padding: '30px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px'}}>
                                            <i className="fas fa-check-circle" style={{fontSize: '4rem', color: '#2ecc71', marginBottom: '15px'}}></i>
                                            <h3 style={{color: 'white', margin: 0}}>¡Esgrima Completado!</h3>
                                            <p style={{color: 'var(--text-muted)'}}>Los resultados han sido guardados permanentemente en el sistema.</p>
                                        </div>
                                    ) : (
                                        <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px'}}>
                                            {esgrimaPreguntasDB.map((q, index) => (
                                                <div key={q.id} style={{background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '12px', borderLeft: `4px solid ${respuestasEsgrima[q.id] ? colorMap[respuestasEsgrima[q.id]] : 'gray'}`}}>
                                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px'}}>
                                                        <div style={{color: 'white', fontSize: '1.1rem', paddingRight: '20px'}}><strong>{index + 1}.</strong> {q.texto}</div>
                                                        <div style={{background: 'rgba(255,215,0,0.1)', color: 'var(--accent)', padding: '5px 10px', borderRadius: '20px', fontWeight: 'bold', whiteSpace: 'nowrap'}}>{q.puntos} pts</div>
                                                    </div>
                                                    <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                                                        <span style={{color: 'var(--text-muted)', display: 'flex', alignItems: 'center', fontSize: '0.9rem', marginRight: '10px', width: '100%'}}>Contestada por:</span>
                                                        {EQUIPOS.map(eq => (
                                                            <button key={eq} className="glass-btn" style={{padding: '8px 20px', background: respuestasEsgrima[q.id] === eq ? colorMap[eq] : '', color: respuestasEsgrima[q.id] === eq ? 'black' : 'white', borderColor: respuestasEsgrima[q.id] === eq ? colorMap[eq] : ''}} onClick={() => setRespuestasEsgrima({...respuestasEsgrima, [q.id]: eq})}>
                                                                {eq}
                                                            </button>
                                                        ))}
                                                        {respuestasEsgrima[q.id] && (
                                                            <button className="glass-btn" style={{color: 'gray', borderColor: 'transparent'}} onClick={() => {const newResp = {...respuestasEsgrima}; delete newResp[q.id]; setRespuestasEsgrima(newResp);}}><i className="fas fa-times"></i> Anular</button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {esgrimaPreguntasDB.length > 0 ? (
                                                <button className="btn-start" disabled={isSubmittingEsgrima} onClick={guardarResultadosEsgrimaTotales} style={{marginTop: '20px', justifyContent: 'center', padding: '15px', fontSize: '1.1rem', background: isSubmittingEsgrima ? 'gray' : ''}}>
                                                    {isSubmittingEsgrima ? 'Calculando y Guardando...' : <><i className="fas fa-calculator"></i> Guardar y Calcular Totales de Esgrima</>}
                                                </button>
                                            ) : <p style={{color: 'var(--accent)', fontStyle: 'italic', textAlign: 'center'}}>No has creado ninguna pregunta. Ve al Cuarto de Máquinas para crearlas.</p>}
                                        </div>
                                    )}
                                </div>

                                {/* SECCIÓN 3: RESULTADOS ACUMULADOS EN VIVO */}
                                <div>
                                    <h3 style={{color: 'var(--accent)', borderBottom: '1px solid rgba(255,215,0,0.3)', paddingBottom: '10px'}}>3. Puntos Acumulados de Esgrima</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
                                        {EQUIPOS.map(eq => {
                                            const teamColor = colorMap[eq];
                                            let totalPts = 0;
                                            
                                            [1,2,3].forEach(num => {
                                                const a = esgrimaActividadesDB[`act${num}`];
                                                if (a) {
                                                    if (a.ganadorDinámica === eq) totalPts += a.puntosDinamica;
                                                    if (a.ganadorDinámica === eq && a.contestoPregunta) totalPts += a.puntosPregunta;
                                                    if (a.equipoRebote === eq) totalPts += a.puntosPregunta;
                                                }
                                            });
                                            if (esgrimaResultadosDB.guardadoFinal) {
                                                totalPts += (esgrimaResultadosDB.puntosTotales?.[eq] || 0) - totalPts; // Para que muestre el total de DB directo
                                            } else {
                                                esgrimaPreguntasDB.forEach(q => { if (respuestasEsgrima[q.id] === eq) totalPts += q.puntos; });
                                            }

                                            return (
                                                <div key={eq} style={{ background: 'rgba(255,255,255,0.03)', borderTop: `5px solid ${teamColor}`, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
                                                    <h3 style={{ color: teamColor, margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.2rem' }}>{eq}</h3>
                                                    <div style={{fontSize: '3.5rem', fontWeight: 'bold', color: 'white', marginTop: '10px'}}>{totalPts}</div>
                                                    <div style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>pts ganados</div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MÓDULO: DINÁMICAS */}
                        {activeCampModule === 'dinamicas' && (
                            <div style={{zIndex: 10}}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h2 style={{ fontSize: '2rem', margin: 0 }}><i className="fas fa-running" style={{color: 'var(--accent)', marginRight: '10px'}}></i>Dinámicas</h2>
                                </div>

                                {dinamicasDB.length === 0 ? (
                                    <p style={{color: 'gray', fontStyle: 'italic', textAlign: 'center', marginTop: '50px'}}>No has creado ninguna dinámica. Ve al Cuarto de Máquinas para crearlas.</p>
                                ) : (
                                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px'}}>
                                        {dinamicasDB.map((d, index) => {
                                            const isSaved = dinamicasResultados.find(r => r.dinamicaId === d.id);
                                            
                                            if (isSaved) {
                                                return (
                                                    <div key={d.id} style={{background: 'rgba(255,255,255,0.05)', borderRadius: '15px', padding: '20px', borderLeft: '5px solid #2ecc71'}}>
                                                        <h3 style={{margin: '0 0 5px 0', color: 'white'}}>{index + 1}. {d.nombre}</h3>
                                                        <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 15px 0'}}>{d.detalles}</p>
                                                        <div style={{background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '10px'}}>
                                                            <div style={{color: 'var(--accent)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '5px'}}>Equipos Ganadores (+{d.puntos} pts c/u):</div>
                                                            <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                                                                {isSaved.equiposGanadores.map(eq => (
                                                                    <span key={eq} style={{background: colorMap[eq], color: 'black', padding: '5px 10px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem'}}>{eq}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            }

                                            const localSelections = dinamicasGanadoresLocal[d.id] || [];
                                            const needed = parseInt(d.ganadoresValidos);

                                            return (
                                                <div key={d.id} style={{background: 'rgba(0,0,0,0.4)', borderRadius: '15px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)'}}>
                                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                                                        <h3 style={{margin: '0 0 5px 0', color: 'white'}}>{index + 1}. {d.nombre}</h3>
                                                        <span style={{background: 'rgba(255,215,0,0.1)', color: 'var(--accent)', padding: '5px 10px', borderRadius: '20px', fontWeight: 'bold'}}>{d.puntos} pts</span>
                                                    </div>
                                                    <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 15px 0'}}>{d.detalles}</p>
                                                    
                                                    <div style={{marginBottom: '15px'}}>
                                                        <label style={{color: 'var(--accent)', fontSize: '0.9rem'}}>Selecciona {needed} ganador(es):</label>
                                                        {Array.from({length: needed}).map((_, i) => (
                                                            <select key={i} value={localSelections[i] || ''} onChange={(e) => handleSelectWinnerLocal(d.id, e.target.value, i, d.ganadoresValidos)} style={{width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid gray', outline: 'none', marginTop: '10px'}}>
                                                                <option value="">-- Seleccionar Equipo --</option>
                                                                {EQUIPOS.map(eq => <option key={eq} value={eq} disabled={localSelections.includes(eq) && localSelections[i] !== eq}>{eq}</option>)}
                                                            </select>
                                                        ))}
                                                    </div>

                                                    <button className="btn-start" style={{width: '100%', padding: '10px', fontSize: '0.9rem', justifyContent: 'center'}} onClick={() => guardarResultadoDinamica(d)}>
                                                        <i className="fas fa-save"></i> Guardar Puntos
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* MÓDULO: RESCATE DE PUNTOS */}
                        {activeCampModule === 'rescate' && (
                            <div style={{zIndex: 10}}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h2 style={{ fontSize: '2rem', margin: 0 }}><i className="fas fa-life-ring" style={{color: 'var(--accent)', marginRight: '10px'}}></i>Rescate de Puntos</h2>
                                </div>

                                {rescateDB.length === 0 ? (
                                    <p style={{color: 'gray', fontStyle: 'italic', textAlign: 'center', marginTop: '50px'}}>No hay preguntas de rescate. Ve al Cuarto de Máquinas para crearlas.</p>
                                ) : (
                                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px'}}>
                                        {rescateDB.map((r, index) => {
                                            const isSaved = rescateResultados.find(res => res.rescateId === r.id);
                                            const st = actsRescateLocal[r.id] || { equipoAsignado: '', contestoPregunta: null, equipoRebote: '' };

                                            if (isSaved) {
                                                return (
                                                    <div key={r.id} style={{background: 'rgba(255,255,255,0.05)', borderRadius: '15px', padding: '20px', borderTop: `4px solid ${colorMap[isSaved.equipoAsignado]}`}}>
                                                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px'}}>
                                                            <h4 style={{margin: 0, color: 'var(--accent)'}}>Pregunta #{index + 1}</h4>
                                                            <span style={{background: 'rgba(255,215,0,0.1)', color: 'var(--accent)', padding: '3px 8px', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.8rem'}}>{r.puntos} pts</span>
                                                        </div>
                                                        <p style={{color: 'white', fontSize: '0.95rem', fontStyle: 'italic'}}>"{r.texto}"</p>
                                                        <p style={{color: 'white', fontSize: '0.9rem', marginTop: '10px'}}><strong>Asignada a:</strong> <span style={{color: colorMap[isSaved.equipoAsignado]}}>{isSaved.equipoAsignado}</span></p>
                                                        <p style={{color: 'white', fontSize: '0.9rem'}}><strong>¿Contestó?:</strong> {isSaved.contestoPregunta ? <span style={{color: '#2ecc71'}}>Sí (+{r.puntos} pts)</span> : <span style={{color: '#e74c3c'}}>No</span>}</p>
                                                        {!isSaved.contestoPregunta && (
                                                            <p style={{color: 'white', fontSize: '0.9rem'}}><strong>Rebote:</strong> <span style={{color: colorMap[isSaved.equipoRebote]}}>{isSaved.equipoRebote} (+{r.puntos} pts)</span></p>
                                                        )}
                                                    </div>
                                                )
                                            }

                                            return (
                                                <div key={r.id} style={{background: 'rgba(0,0,0,0.4)', borderRadius: '15px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)'}}>
                                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px'}}>
                                                        <h4 style={{margin: 0, color: 'white'}}>Pregunta #{index + 1}</h4>
                                                        <span style={{background: 'rgba(255,215,0,0.1)', color: 'var(--accent)', padding: '3px 8px', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.8rem'}}>{r.puntos} pts</span>
                                                    </div>
                                                    <p style={{color: 'var(--text-muted)', fontSize: '0.95rem', fontStyle: 'italic', marginBottom: '15px'}}>"{r.texto}"</p>
                                                    
                                                    <div style={{marginBottom: '15px'}}>
                                                        <label style={{color: 'white', fontSize: '0.85rem'}}>Equipo Asignado:</label>
                                                        <div style={{display: 'flex', gap: '5px', marginTop: '5px', flexWrap: 'wrap'}}>
                                                            {EQUIPOS.map(eq => (
                                                                <button key={eq} className="glass-btn" style={{flex: 1, minWidth: '40%', padding: '5px', fontSize: '0.8rem', background: st.equipoAsignado === eq ? colorMap[eq] : '', color: st.equipoAsignado === eq ? 'black' : 'white'}} onClick={() => setActsRescateLocal({...actsRescateLocal, [r.id]: {...st, equipoAsignado: eq}})}>
                                                                    {eq}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {st.equipoAsignado && (
                                                        <div style={{marginBottom: '15px', animation: 'fadeIn 0.3s'}}>
                                                            <label style={{color: 'white', fontSize: '0.85rem'}}>¿Contestó correctamente?</label>
                                                            <div style={{display: 'flex', gap: '10px', marginTop: '5px'}}>
                                                                <button className="glass-btn" style={{flex: 1, background: st.contestoPregunta === true ? '#2ecc71' : '', color: st.contestoPregunta === true ? 'black' : 'white'}} onClick={() => setActsRescateLocal({...actsRescateLocal, [r.id]: {...st, contestoPregunta: true, equipoRebote: ''}})}>Sí</button>
                                                                <button className="glass-btn" style={{flex: 1, background: st.contestoPregunta === false ? '#e74c3c' : '', color: st.contestoPregunta === false ? 'white' : 'white'}} onClick={() => setActsRescateLocal({...actsRescateLocal, [r.id]: {...st, contestoPregunta: false}})}>No</button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {st.contestoPregunta === false && (
                                                        <div style={{marginBottom: '15px', animation: 'fadeIn 0.3s'}}>
                                                            <label style={{color: 'var(--accent)', fontSize: '0.85rem'}}>ROBO: ¿Qué equipo la contestó?</label>
                                                            <div style={{display: 'flex', gap: '5px', marginTop: '5px', flexWrap: 'wrap'}}>
                                                                {EQUIPOS.filter(e => e !== st.equipoAsignado).map(eq => (
                                                                    <button key={eq} className="glass-btn" style={{flex: 1, minWidth: '40%', padding: '5px', fontSize: '0.8rem', background: st.equipoRebote === eq ? colorMap[eq] : '', color: st.equipoRebote === eq ? 'black' : 'white'}} onClick={() => setActsRescateLocal({...actsRescateLocal, [r.id]: {...st, equipoRebote: eq}})}>
                                                                        {eq}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <button className="btn-start" style={{width: '100%', padding: '10px', fontSize: '0.9rem', justifyContent: 'center'}} onClick={() => guardarResultadoRescate(r)}>
                                                        <i className="fas fa-save"></i> Guardar Puntos
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* MÓDULO: LIGA SUBASTA */}
                        {activeCampModule === 'subasta' && (
                            <div style={{zIndex: 10}}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h2 style={{ fontSize: '2rem', margin: 0 }}><i className="fas fa-gavel" style={{color: 'var(--accent)', marginRight: '10px'}}></i>Liga Subasta</h2>
                                    {actividades?.['subasta']?.['global'] === 'completado' ? (
                                        <span style={{background: '#2ecc71', color: 'black', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold'}}>Subasta Finalizada</span>
                                    ) : (
                                        <button className="btn-start" style={{margin: 0, padding: '8px 20px', fontSize: '0.9rem'}} onClick={() => openLinkModal(`${window.location.origin}/?modo=proyector`, 'Conecta el Proyector')}><i className="fas fa-desktop"></i> Proyector</button>
                                    )}
                                </div>

                                {actividades?.['subasta']?.['global'] === 'completado' ? (
                                    <div style={{textAlign: 'center', padding: '50px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: '1px solid var(--accent)'}}>
                                        <i className="fas fa-lock" style={{fontSize: '5rem', color: 'var(--accent)', marginBottom: '20px'}}></i>
                                        <h2 style={{color: 'white', margin: 0}}>Subasta Cerrada</h2>
                                        <p style={{color: 'var(--text-muted)'}}>Todos los lotes y bonos del banco han sido contabilizados en la tabla general.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* PANEL DE EJECUCIÓN DEL LOTE ACTIVO */}
                                        {subastaActiveLot ? (
                                            <div style={{background: 'rgba(0,0,0,0.6)', borderRadius: '20px', padding: '30px', border: '2px solid var(--accent)', boxShadow: '0 0 30px rgba(255,215,0,0.2)', marginBottom: '40px', animation: 'fadeIn 0.5s'}}>
                                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '15px', marginBottom: '20px', flexWrap: 'wrap'}}>
                                                    <div>
                                                        <h4 style={{color: 'var(--accent)', margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '2px'}}>Lote en Ejecución</h4>
                                                        <h2 style={{color: 'white', fontSize: '2.5rem', margin: 0}}>#{subastaActiveLot.numero}: {subastaActiveLot.nombre}</h2>
                                                    </div>
                                                    <div style={{textAlign: 'left', marginTop: '10px'}}>
                                                        <div style={{color: '#ffd700', fontSize: '1.2rem', fontWeight: 'bold'}}><i className="fas fa-coins"></i> Base: {subastaActiveLot.base}</div>
                                                        <div style={{color: 'var(--accent)', fontSize: '1.5rem', fontWeight: 'bold'}}><i className="fas fa-star"></i> Premio: {subastaActiveLot.premioPV} PV</div>
                                                    </div>
                                                </div>

                                                <div style={{background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '15px', marginBottom: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
                                                    <div style={{flex: 1, minWidth: '200px'}}>
                                                        <h4 style={{color: 'var(--text-muted)', margin: '0 0 10px 0'}}>Reto para el Moderador:</h4>
                                                        <p style={{color: 'white', fontSize: '1.1rem', lineHeight: '1.6', margin: 0}}>{subastaActiveLot.detalle}</p>
                                                    </div>
                                                    <div style={{textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px', minWidth: '150px'}}>
                                                        <h4 style={{color: 'var(--text-muted)', margin: '0 0 10px 0'}}>Tiempo:</h4>
                                                        <div style={{fontSize: '2rem', color: 'white', fontWeight: 'bold'}}>{subastaActiveLot.tiempoSecs > 0 ? `${subastaActiveLot.tiempoSecs}s` : 'Sin Límite'}</div>
                                                    </div>
                                                </div>

                                                {/* FASE 1: ¿Quién Compró? */}
                                                <div style={{marginBottom: '20px'}}>
                                                    <label style={{color: 'white', fontSize: '1.1rem'}}>¿Qué equipo compró el lote?</label>
                                                    <div style={{display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap'}}>
                                                        {EQUIPOS.map(eq => (
                                                            <button key={eq} className="glass-btn" style={{flex: 1, minWidth: '40%', padding: '15px', fontSize: '1.1rem', background: subastaEjecucion.comprador === eq ? colorMap[eq] : '', color: subastaEjecucion.comprador === eq ? 'black' : 'white', borderColor: subastaEjecucion.comprador === eq ? colorMap[eq] : ''}} onClick={() => setSubastaEjecucion({...subastaEjecucion, comprador: eq, cumplio: null, rebote: '', cumplioRebote: null})}>
                                                                {eq}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Botón para lanzar cronómetro / proyector */}
                                                <div style={{textAlign: 'center', marginBottom: '30px'}}>
                                                    <button className="btn-start" style={{background: 'transparent', border: '2px solid var(--accent)', color: 'var(--accent)', flexWrap: 'wrap'}} onClick={() => proyectarLote(subastaActiveLot, 'subasta-activa')}>
                                                        <i className="fas fa-desktop"></i> Mostrar Reto / Iniciar Tiempo
                                                    </button>
                                                </div>

                                                {/* FASE 2: Resultado Comprador */}
                                                {subastaEjecucion.comprador && (
                                                    <div style={{background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '15px', marginBottom: '20px', animation: 'fadeIn 0.3s'}}>
                                                        <label style={{color: 'white', fontSize: '1.1rem'}}>¿El equipo {subastaEjecucion.comprador} completó el reto?</label>
                                                        <div style={{display: 'flex', gap: '15px', marginTop: '10px', flexWrap: 'wrap'}}>
                                                            <button className="glass-btn" style={{flex: 1, minWidth: '40%', padding: '12px', background: subastaEjecucion.cumplio === true ? '#2ecc71' : '', color: subastaEjecucion.cumplio === true ? 'black' : 'white'}} onClick={() => setSubastaEjecucion({...subastaEjecucion, cumplio: true, rebote: '', cumplioRebote: null})}>Sí, ganan {subastaActiveLot.premioPV} PV</button>
                                                            <button className="glass-btn" style={{flex: 1, minWidth: '40%', padding: '12px', background: subastaEjecucion.cumplio === false ? '#e74c3c' : '', color: subastaEjecucion.cumplio === false ? 'white' : 'white'}} onClick={() => setSubastaEjecucion({...subastaEjecucion, cumplio: false})}>No, fallaron</button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* FASE 3: Rebote */}
                                                {subastaEjecucion.cumplio === false && (
                                                    <div style={{background: 'rgba(255,215,0,0.1)', padding: '20px', borderRadius: '15px', marginBottom: '20px', border: '1px solid var(--accent)', animation: 'fadeIn 0.3s'}}>
                                                        <label style={{color: 'var(--accent)', fontSize: '1.1rem', fontWeight: 'bold'}}>¡REBOTE A MITAD DE PRECIO!</label>
                                                        <p style={{color: 'var(--text-muted)', margin: '5px 0 15px 0'}}>¿Algún otro equipo lo compró y superó el reto?</p>
                                                        
                                                        <div style={{display: 'flex', gap: '5px', marginBottom: '15px', flexWrap: 'wrap'}}>
                                                            {EQUIPOS.filter(e => e !== subastaEjecucion.comprador).map(eq => (
                                                                <button key={eq} className="glass-btn" style={{flex: 1, minWidth: '30%', padding: '10px', fontSize: '0.9rem', background: subastaEjecucion.rebote === eq ? colorMap[eq] : '', color: subastaEjecucion.rebote === eq ? 'black' : 'white'}} onClick={() => setSubastaEjecucion({...subastaEjecucion, rebote: eq, cumplioRebote: null})}>
                                                                    {eq}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        {subastaEjecucion.rebote && (
                                                            <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                                                                <button className="glass-btn" style={{flex: 1, minWidth: '40%', padding: '10px', background: subastaEjecucion.cumplioRebote === true ? '#2ecc71' : '', color: subastaEjecucion.cumplioRebote === true ? 'black' : 'white'}} onClick={() => setSubastaEjecucion({...subastaEjecucion, cumplioRebote: true})}>Sí, ganan {subastaActiveLot.premioPV} PV</button>
                                                                <button className="glass-btn" style={{flex: 1, minWidth: '40%', padding: '10px', background: subastaEjecucion.cumplioRebote === false ? '#e74c3c' : '', color: subastaEjecucion.cumplioRebote === false ? 'white' : 'white'}} onClick={() => setSubastaEjecucion({...subastaEjecucion, cumplioRebote: false})}>No</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
                                                    <button className="glass-btn" style={{flex: 1, minWidth: '40%'}} onClick={() => {setSubastaActiveLot(null); emitirAProyector('standby', null, 0);}}>Cancelar / Volver</button>
                                                    <button className="btn-start" style={{flex: 2, minWidth: '50%', justifyContent: 'center', fontSize: '1.2rem', padding: '10px'}} onClick={terminarLote}><i className="fas fa-gavel"></i> Terminar Lote</button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* LISTA DE LOTES PARA SELECCIONAR */
                                            <div style={{marginBottom: '50px'}}>
                                                {subastaLotesDB.length === 0 ? (
                                                    <p style={{color: 'gray', fontStyle: 'italic', textAlign: 'center', marginTop: '50px'}}>No hay lotes configurados. Ve al Cuarto de Máquinas para crearlos.</p>
                                                ) : (
                                                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px'}}>
                                                        {subastaLotesDB.map(lote => {
                                                            const isCompleted = subastaResultadosDB.some(r => r.loteId === lote.id);
                                                            const cardBorderColor = lote.riesgo === 'Fácil' ? '#2ecc71' : lote.riesgo === 'Medio' ? '#f39c12' : lote.riesgo === 'Difícil' ? '#e74c3c' : '#9b59b6';
                                                            
                                                            if (isCompleted) {
                                                                const resultado = subastaResultadosDB.find(r => r.loteId === lote.id);
                                                                return (
                                                                    <div key={lote.id} style={{background: 'rgba(255,255,255,0.05)', borderRadius: '15px', padding: '20px', borderLeft: `5px solid ${colorMap[resultado.equipoGanadorPV] || 'gray'}`}}>
                                                                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                                                                            <h3 style={{margin: 0, color: 'gray', textDecoration: 'line-through'}}>#{lote.numero}: {lote.nombre}</h3>
                                                                            <i className="fas fa-check-circle" style={{color: '#2ecc71', fontSize: '1.2rem'}}></i>
                                                                        </div>
                                                                        <p style={{color: 'white', margin: 0}}>Ganador PV: <strong style={{color: colorMap[resultado.equipoGanadorPV]}}>{resultado.equipoGanadorPV || 'Ninguno'}</strong></p>
                                                                    </div>
                                                                )
                                                            }

                                                            return (
                                                                <div key={lote.id} style={{background: 'rgba(0,0,0,0.4)', borderRadius: '15px', padding: '20px', borderTop: `4px solid ${cardBorderColor}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
                                                                    <div>
                                                                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px'}}>
                                                                            <h3 style={{margin: 0, color: 'white', fontSize: '1.3rem'}}>#{lote.numero}: {lote.nombre}</h3>
                                                                            <span style={{background: 'rgba(255,255,255,0.1)', color: 'white', padding: '3px 8px', borderRadius: '10px', fontSize: '0.8rem'}}>{lote.riesgo}</span>
                                                                        </div>
                                                                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '1.1rem', fontWeight: 'bold'}}>
                                                                            <span style={{color: '#ffd700'}}><i className="fas fa-coins"></i> {lote.base}</span>
                                                                            <span style={{color: 'var(--accent)'}}><i className="fas fa-star"></i> {lote.premioPV}</span>
                                                                        </div>
                                                                    </div>
                                                                    <button className="btn-start" style={{width: '100%', justifyContent: 'center', padding: '12px'}} onClick={() => proyectarLote(lote, 'subasta-previa')}>
                                                                        <i className="fas fa-play"></i> Iniciar Subasta
                                                                    </button>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* BANCO FINAL (MONEDAS A PV) */}
                                        <div style={{borderTop: '2px dashed rgba(255,215,0,0.3)', paddingTop: '40px', marginTop: '20px'}}>
                                            <h2 style={{ fontSize: '2rem', margin: '0 0 10px 0', textAlign: 'center' }}><i className="fas fa-piggy-bank" style={{color: '#ffd700', marginRight: '10px'}}></i>Cierre de Banco</h2>
                                            <p style={{textAlign: 'center', color: 'var(--text-muted)', marginBottom: '30px'}}>Calcula el Bono de Ahorro final. Se otorgarán 10 PV por cada 100 monedas que los equipos no gastaron.</p>
                                            
                                            <form onSubmit={guardarBonoBanco} style={{background: 'rgba(0,0,0,0.4)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,215,0,0.2)', maxWidth: '600px', margin: '0 auto'}}>
                                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '20px', marginBottom: '30px'}}>
                                                    {EQUIPOS.map(eq => (
                                                        <div key={eq} style={{textAlign: 'center'}}>
                                                            <label style={{color: colorMap[eq], fontWeight: 'bold', fontSize: '1.2rem', display: 'block', marginBottom: '10px'}}>{eq}</label>
                                                            <input type="number" min="0" placeholder="Monedas" value={sobrantesBanco[eq]} onChange={(e) => setSobrantesBanco({...sobrantesBanco, [eq]: e.target.value})} style={{width: '100%', padding: '15px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#ffd700', border: `1px solid ${colorMap[eq]}`, outline: 'none', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold'}} required />
                                                        </div>
                                                    ))}
                                                </div>
                                                <button type="submit" disabled={isSubmittingBanco} className="btn-start" style={{width: '100%', justifyContent: 'center', padding: '15px', fontSize: '1.2rem', flexWrap: 'wrap'}}>
                                                    {isSubmittingBanco ? 'Calculando...' : <><i className="fas fa-lock"></i> Calcular Bonos y Cerrar Subasta</>}
                                                </button>
                                            </form>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* MÓDULO 6: MEJORES CAMPISTAS (ANFITRIÓN) */}
                        {activeCampModule === 'mejores' && (
                            <div style={{zIndex: 10}}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h2 style={{ fontSize: '2rem', margin: 0 }}><i className="fas fa-star" style={{color: 'var(--accent)', marginRight: '10px'}}></i>Mejores Campistas</h2>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                                    {EQUIPOS.map(equipo => {
                                        const teamColor = colorMap[equipo];
                                        const elMejor = mejoresCampistas.find(m => m.id === equipo);
                                        return (
                                            <div key={equipo} className="cat-card" style={{ background: 'rgba(255,255,255,0.03)', borderTop: `5px solid ${teamColor}`, borderRadius: '12px', padding: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', cursor: 'default' }}>
                                                <h3 style={{ color: teamColor, margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.5rem' }}>{equipo}</h3>
                                                {elMejor ? (
                                                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '10px'}}>
                                                        <img src={elMejor.fotoUrl} style={{width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: `4px solid ${teamColor}`, boxShadow: `0 0 20px ${teamColor}80`}} alt="" />
                                                        <div style={{fontSize: '1.4rem', fontWeight: 'bold', color: 'white', marginTop: '10px'}}>{elMejor.nombre}</div>
                                                        <div style={{fontSize: '1.2rem', color: 'var(--accent)', fontWeight: 'bold'}}>Campista #{elMejor.numero || "?"}</div>
                                                        <i className="fas fa-medal" style={{fontSize: '2rem', color: '#ffd700', marginTop: '5px'}}></i>
                                                    </div>
                                                ) : <div style={{color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: '30px 0'}}>Esperando selección del líder...</div>}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {activeCampModule === 'videos' && (
                            <div className="camp-dashboard-view">
                                <i className="fas fa-video" style={{fontSize: '4rem', color: 'var(--accent)', marginBottom: '20px'}}></i>
                                <h2 style={{fontSize: '2.5rem', margin: 0}}>Coros Especiales</h2>
                                <button className="btn-start" onClick={() => showVideoList(specialTracks, "VIDEOS DE COROS")}><i className="fas fa-play"></i> Abrir Reproductor</button>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* PANTALLA 3: LISTA DE HIMNOS */}
            {screen === 'list' && role === 'control' && (
                <section className="screen inner-screen">
                    <div className="particles"></div>
                    <div className="top-bar">
                        <button className="glass-btn" onClick={() => setScreen('menu')}><i className="fas fa-arrow-left"></i> Menú</button>
                        <h2>{rangeTitle}</h2>
                        <div style={{ width: '70px' }}></div>
                    </div>
                    <div className="hymn-grid">
                        {filteredHymns.length === 0 ? <p style={{ opacity: 0.7 }}>Cargando himnos...</p> : filteredHymns.map(h => (
                            <div key={h.id_doc} className="hymn-btn" onClick={() => openHymn(h)}>
                                <i className="fas fa-music"></i><span>{h.numero}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* PANTALLA 4: VISOR DE HIMNOS */}
            {screen === 'viewer' && slides.length > 0 && (
                <section className="screen" id="viewer-screen">
                    <div className="particles"></div>
                    <div className="watermark-number">{currentHymn?.numero}</div>
                    <h1 className="hymn-title" style={{ opacity: slideIndex === 0 ? 1 : 0 }}>{currentHymn?.numero}. {currentHymn?.titulo}</h1>
                    
                    {role === 'control' && (
                        <>
                            <div className="nav-arrow nav-prev" onClick={prevSlide}><i className="fas fa-chevron-left"></i></div>
                            <div className="nav-arrow nav-next" onClick={nextSlide}><i className="fas fa-chevron-right"></i></div>
                        </>
                    )}

                    <div className="viewer-content" onClick={role === 'control' ? nextSlide : undefined}>
                        {slides[slideIndex].type === 'chorus' && <div style={{ fontSize: '0.8em', marginBottom: '20px', color: 'var(--accent)', fontWeight: 'bold', letterSpacing: '2px' }}>(CORO)</div>}
                        <div className="slide-text" style={{ fontSize: `${fontSize}rem`, color: slides[slideIndex].type === 'chorus' ? 'var(--accent)' : 'white', fontStyle: slides[slideIndex].type === 'chorus' ? 'italic' : 'normal', fontWeight: slides[slideIndex].type === 'chorus' ? 'bold' : 'normal' }}>
                            {slides[slideIndex].text}
                        </div>
                    </div>

                    <div className="slide-counter">{slideIndex + 1} / {slides.length}</div>

                    {role === 'control' && (
                        <div className="fab-container">
                            <div className="fab-trigger"><i className="fas fa-cog"></i></div>
                            <div className="fab-actions">
                                <button className="control-btn" onClick={(e) => cambiarTamanoLetra(0.2, e)}>A+</button>
                                <button className="control-btn" onClick={(e) => cambiarTamanoLetra(-0.2, e)}>A-</button>
                                <button className="control-btn btn-exit" onClick={(e) => { e.stopPropagation(); goBackToMenu(); }}><i className="fas fa-arrow-left"></i></button>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* PANTALLAS DE VIDEO */}
            {screen === 'videos' && role === 'control' && (
                <section className="screen inner-screen">
                    <div className="particles"></div>
                    <div className="top-bar">
                        <button className="glass-btn" onClick={() => setScreen('camp-admin')}><i className="fas fa-arrow-left"></i> Volver</button>
                        <h2 style={{ color: 'var(--accent)' }}>{videoTitle}</h2>
                        <div style={{ width: '70px' }}></div>
                    </div>
                    <div className="video-list-container">
                        {activeVideoList.map((track, idx) => (
                            <div key={idx} className="video-item" onClick={() => playVideo(track)}>
                                <div className="video-icon"><i className="fas fa-play-circle"></i></div>
                                <div className="video-info"><h3>{track.title}</h3><p>{track.desc}</p></div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {screen === 'video-player' && currentVideo && role === 'control' && (
                <section className="screen" id="video-screen">
                    <div className="particles"></div>
                    <button className="glass-btn video-back-btn" onClick={() => setScreen('videos')}><i className="fas fa-arrow-left"></i> Volver</button>
                    <div className="video-wrapper">
                        <video controls autoPlay controlsList="nodownload" src={currentVideo.file}>Tu navegador no soporta videos.</video>
                    </div>
                    <div className="video-footer">"Todo lo hizo Dios"</div>
                </section>
            )}
        </>
    );
}