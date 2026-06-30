import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, doc, onSnapshot, setDoc, getDoc, addDoc } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { specialTracks, corosBiblicaTracks, verses } from './data/constants';
import './App.css'; 
import '@fortawesome/fontawesome-free/css/all.min.css'; 

// Usamos import.meta.env para leer las variables ocultas en Vite
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
    
    // ==========================================
    // ESTADOS: MÓDULO DEL LÍDER
    // ==========================================
    const [liderLogueado, setLiderLogueado] = useState(null); 
    
    // Registro Local
    const [localCampers, setLocalCampers] = useState([]); 
    const [camperNum, setCamperNum] = useState('');
    const [camperNombre, setCamperNombre] = useState('');
    const [camperEdad, setCamperEdad] = useState('');
    const [camperFotoObj, setCamperFotoObj] = useState(null);
    const [camperFotoPreview, setCamperFotoPreview] = useState(null);
    const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

    // Evaluación Verso Local
    const [verseScores, setVerseScores] = useState({});
    const [isSubmittingVerso, setIsSubmittingVerso] = useState(false);

    // Selección Mejor Campista Local
    const [selectedBestCamper, setSelectedBestCamper] = useState(null);
    const [isSubmittingBest, setIsSubmittingBest] = useState(false);

    // ==========================================
    // ESTADOS: MÓDULO DEL JUEZ DE CORO
    // ==========================================
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
    const [nuevoLider, setNuevoLider] = useState({ nombre: '', equipo: '', fotoObj: null, fotoPreview: null });
    const [isSubmittingLider, setIsSubmittingLider] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [modalUrl, setModalUrl] = useState('');
    const [modalTitle, setModalTitle] = useState('');

    // CÁMARA Y ALERTAS
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [toastMsg, setToastMsg] = useState('');

    const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3500); };

    const openLinkModal = (url, title) => {
        setModalUrl(url);
        setModalTitle(title);
        setShowLinkModal(true);
    };

    // ==========================================
    // INICIO: DETECCIÓN DE URL (?modo=lider | ?modo=juez)
    // ==========================================
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('modo') === 'lider') {
            setRole('lider');
            setRoleStep('ready');
            setScreen('lider-login');
        } else if (params.get('modo') === 'juez') {
            setRole('juez');
            setRoleStep('ready');
            setScreen('juez-coro');
        }
    }, []);

    // ==========================================
    // 1. AUTENTICACIÓN Y CARGA DE DATOS (HIMNOS)
    // ==========================================
    useEffect(() => {
        const fetchHymns = async () => {
            const cachedHymns = localStorage.getItem('hymnosCache');
            if (cachedHymns) { setAllHymns(JSON.parse(cachedHymns)); }
            try {
                const q = query(collection(db, "himnos"), orderBy("numero"));
                const snapshot = await getDocs(q);
                const hymnsData = snapshot.docs.map(doc => ({ id_doc: doc.id, ...doc.data() }));
                setAllHymns(hymnsData);
                localStorage.setItem('hymnosCache', JSON.stringify(hymnsData)); 
            } catch (error) { console.error("Error al cargar himnos:", error); }
        };

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) fetchHymns(); 
            else signInAnonymously(auth).catch(console.error);
        });

        return () => unsubscribeAuth();
    }, []);

    // ==========================================
    // 2. ESCUCHADORES EN VIVO (CAMPISTAS, LIDERES, VERSOS, COROS, ACTIVIDADES)
    // ==========================================
    useEffect(() => {
        const unCamp = onSnapshot(collection(db, "campistas"), (snapshot) => {
            setCampistas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unLid = onSnapshot(collection(db, "lideres"), (snapshot) => {
            setLideres(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unVerso = onSnapshot(collection(db, "eval_verso"), (snapshot) => {
            setEvaluacionesVerso(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unCoro = onSnapshot(collection(db, "eval_coro"), (snapshot) => {
            setEvaluacionesCoro(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unBest = onSnapshot(collection(db, "mejores_campistas"), (snapshot) => {
            setMejoresCampistas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unAct = onSnapshot(doc(db, "campamento", "actividades"), (docSnap) => {
            if (docSnap.exists()) setActividades(docSnap.data());
        });
        return () => { unCamp(); unLid(); unVerso(); unCoro(); unBest(); unAct(); };
    }, []);

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
    const startCamera = async () => {
        setShowCamera(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) { showToast("No se pudo acceder a la cámara."); setShowCamera(false); }
    };

    const capturePhoto = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!video || !canvas) return;
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
            const file = new File([blob], `captura_${Date.now()}.jpg`, { type: "image/jpeg" });
            setCamperFotoObj(file); setCamperFotoPreview(URL.createObjectURL(file));
            stopCamera();
        }, 'image/jpeg');
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) { videoRef.current.srcObject.getTracks().forEach(track => track.stop()); }
        setShowCamera(false);
    };

    // ==========================================
    // 5. FUNCIONES DEL LÍDER (LOGIN DIRECTO)
    // ==========================================
    const loginLider = (liderId) => {
        const liderFound = lideres.find(l => l.id === liderId);
        setLiderLogueado(liderFound);
        setScreen('lider-dashboard');
        showToast(`¡Bienvenido/a ${liderFound.nombre}!`);
    };

    const agregarAListaLocal = (e) => {
        e.preventDefault();
        if (!camperNum || !camperNombre || !camperEdad || !camperFotoObj) return showToast("Completa todos los campos y la foto.");
        setLocalCampers([...localCampers, { numero: camperNum, nombre: camperNombre, edad: camperEdad, fotoObj: camperFotoObj, fotoPreview: camperFotoPreview }]);
        setCamperNum(''); setCamperNombre(''); setCamperEdad(''); setCamperFotoObj(null); setCamperFotoPreview(null);
        showToast(`Campista #${camperNum} añadido a la lista.`);
    };

    const guardarRegistroFinal = async () => {
        if (localCampers.length === 0) return showToast("La lista está vacía.");
        setIsSubmittingBatch(true);
        showToast("Subiendo registros a la nube...");
        try {
            for (let c of localCampers) {
                const fotoRef = ref(storage, `campistas_fotos/${Date.now()}_${c.fotoObj.name}`);
                await uploadBytes(fotoRef, c.fotoObj);
                const url = await getDownloadURL(fotoRef);
                await addDoc(collection(db, "campistas"), {
                    numero: c.numero, nombre: c.nombre, edad: parseInt(c.edad),
                    equipo: liderLogueado.equipo, liderId: liderLogueado.id,
                    fotoUrl: url, fecha: new Date().toISOString()
                });
            }
            showToast(`¡${localCampers.length} campistas guardados exitosamente!`);
            setLocalCampers([]);
        } catch (error) { showToast("Hubo un error al guardar los registros."); } 
        finally { setIsSubmittingBatch(false); }
    };

    const handleVerseScoreChange = (campistaId, value) => {
        let num = parseInt(value);
        if (isNaN(num)) num = '';
        if (num > 10) num = 10;
        setVerseScores({...verseScores, [campistaId]: num});
    };

    const guardarEvaluacionVerso = async (targetTeam) => {
        setIsSubmittingVerso(true);
        showToast("Guardando notas del verso...");
        try {
            await setDoc(doc(db, "eval_verso", targetTeam), {
                scores: verseScores,
                evaluadorId: liderLogueado.id,
                fecha: new Date().toISOString()
            });
            await setDoc(doc(db, "campamento", "actividades"), {
                'eval-verso': { [liderLogueado.equipo]: 'completado' }
            }, { merge: true });
            showToast("¡Evaluación guardada exitosamente!");
            setScreen('lider-dashboard');
        } catch (error) { showToast("Error al guardar la evaluación."); } 
        finally { setIsSubmittingVerso(false); }
    };

    const guardarMejorCampista = async () => {
        if (!selectedBestCamper) return showToast("Debes seleccionar a un campista primero.");
        setIsSubmittingBest(true);
        showToast("Guardando al mejor campista...");
        try {
            await setDoc(doc(db, "mejores_campistas", liderLogueado.equipo), {
                campistaId: selectedBestCamper.id || "",
                nombre: selectedBestCamper.nombre || "Desconocido",
                fotoUrl: selectedBestCamper.fotoUrl || "",
                numero: selectedBestCamper.numero || "", 
                liderId: liderLogueado.id || "",
                fecha: new Date().toISOString()
            });
            await setDoc(doc(db, "campamento", "actividades"), {
                'mejores': { [liderLogueado.equipo]: 'completado' }
            }, { merge: true });
            showToast("¡Mejor campista guardado exitosamente!");
            setScreen('lider-dashboard');
        } catch (error) { 
            console.error("Error al guardar el mejor campista:", error); 
            showToast("Error al guardar."); 
        } 
        finally { setIsSubmittingBest(false); }
    };

    // ==========================================
    // FUNCIONES DEL JUEZ DE CORO
    // ==========================================
    const handleJuezScoreChange = (setter, max, value) => {
        let num = parseInt(value);
        if (isNaN(num)) return setter('');
        if (num < 0) num = 0;
        if (num > max) num = max;
        setter(num);
    };

    const guardarEvaluacionCoro = async (e) => {
        e.preventDefault();
        if (!juezNombre || !juezEquipo1 || !juezEquipo2 || juezRitmo === '' || juezVolumen === '' || juezCoordinacion === '') {
            return showToast("Por favor completa todos los campos de la evaluación.");
        }
        if (juezEquipo1 === juezEquipo2) {
            return showToast("Debes seleccionar dos equipos diferentes.");
        }

        setIsSubmittingJuez(true);
        showToast("Guardando calificación...");
        try {
            const total = juezRitmo + juezVolumen + juezCoordinacion;
            await addDoc(collection(db, "eval_coro"), {
                juezNombre: juezNombre,
                equipos: [juezEquipo1, juezEquipo2],
                ritmo: juezRitmo,
                volumen: juezVolumen,
                coordinacion: juezCoordinacion,
                total: total,
                fecha: new Date().toISOString()
            });
            setJuezSubmitted(true);
            showToast("¡Evaluación enviada con éxito!");
        } catch (error) {
            console.error("Error al guardar evaluación coro:", error);
            showToast("Hubo un error al guardar la evaluación.");
        } finally {
            setIsSubmittingJuez(false);
        }
    };

    // ==========================================
    // 6. FUNCIONES DEL ANFITRIÓN (CREAR LÍDER Y SWITCH)
    // ==========================================
    const handleLiderSubmit = async (e) => {
        e.preventDefault();
        if (!nuevoLider.nombre || !nuevoLider.equipo || !nuevoLider.fotoObj) return showToast("Completa los datos del líder y foto.");
        setIsSubmittingLider(true);
        try {
            const fotoRef = ref(storage, `lideres/${Date.now()}_${nuevoLider.fotoObj.name}`);
            await uploadBytes(fotoRef, nuevoLider.fotoObj);
            const url = await getDownloadURL(fotoRef);
            await addDoc(collection(db, "lideres"), { nombre: nuevoLider.nombre, equipo: nuevoLider.equipo, fotoUrl: url });
            showToast("Líder registrado correctamente.");
            setNuevoLider({ nombre: '', equipo: '', fotoObj: null, fotoPreview: null });
        } catch (err) { showToast("Error al crear líder."); }
        setIsSubmittingLider(false);
    };

    const toggleActividad = async (modulo, equipo, currentStatus) => {
        if (currentStatus === 'completado') return showToast("Esta actividad ya fue completada por el líder.");
        const newStatus = currentStatus === 'offline' ? 'online' : 'offline';
        try {
            await setDoc(doc(db, "campamento", "actividades"), { [modulo]: { [equipo]: newStatus } }, { merge: true });
            showToast(`Módulo puesto ${newStatus} para ${equipo}`);
        } catch (error) { showToast("Error al cambiar el estado."); }
    };

    // ==========================================
    // 7. FUNCIONES DEL HIMNARIO Y PROYECTOR
    // ==========================================
    const handleConnect = async () => {
        if (pinInput.length !== 4) return showToast("El código debe tener 4 dígitos.");
        setSessionCode(pinInput);
        if (role === 'control') {
            await setDoc(doc(db, "sesiones", pinInput), { modo: 'standby', himnoId: null, slideIndex: 0, fontSize: 2.5, proyectorConectado: false });
            setRoleStep('ready'); setScreen('welcome');
        } else if (role === 'proyector') {
            const docSnap = await getDoc(doc(db, "sesiones", pinInput));
            if (docSnap.exists()) {
                await setDoc(doc(db, "sesiones", pinInput), { proyectorConectado: true }, { merge: true });
                setRoleStep('ready'); setScreen('welcome');
            } else { showToast("⚠️ Sala no encontrada. Conecta el Control primero."); setPinInput(''); }
        }
    };

    const emitirAProyector = async (modo, himnoId, index) => {
        if (role === 'control' && sessionCode) await setDoc(doc(db, "sesiones", sessionCode), { modo, himnoId, slideIndex: index }, { merge: true }); 
    };

    const cambiarTamanoLetra = async (cambio, e) => {
        if (e) e.stopPropagation();
        let nuevoTamano = Math.min(Math.max(fontSize + cambio, 1.5), 6.0);
        setFontSize(nuevoTamano); 
        if (role === 'control' && sessionCode) await setDoc(doc(db, "sesiones", sessionCode), { fontSize: nuevoTamano }, { merge: true });
    };

    useEffect(() => {
        if (!sessionCode || allHymns.length === 0) return;
        if (role === 'proyector') {
            const unsub = onSnapshot(doc(db, "sesiones", sessionCode), (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.fontSize && data.fontSize !== fontSize) setFontSize(data.fontSize);
                    if (data.modo === 'standby') setScreen('welcome');
                    else if (data.modo === 'himno' && data.himnoId) {
                        const targetHymn = allHymns.find(h => h.id_doc === data.himnoId);
                        if (targetHymn) { cargarDiapositivasLocal(targetHymn); setSlideIndex(data.slideIndex); setScreen('viewer'); }
                    }
                }
            });
            return () => unsub();
        }
        if (role === 'control') {
            const unsub = onSnapshot(doc(db, "sesiones", sessionCode), (docSnap) => {
                if (docSnap.exists()) setProyectorConectado(!!docSnap.data().proyectorConectado);
            });
            return () => unsub();
        }
    }, [role, sessionCode, allHymns, fontSize]);

    const cargarDiapositivasLocal = (hymn) => {
        setCurrentHymn(hymn); let newSlides = [];
        const process = (textArray) => {
            textArray.forEach(estrofa => {
                if(estrofa.trim().length > 0) { newSlides.push({ text: estrofa, type: 'verse' }); if (hymn.tiene_coro && hymn.coro) newSlides.push({ text: hymn.coro, type: 'chorus' }); }
            });
        };
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
                        <p style={{fontSize: '1.2rem', opacity: 0.9, textAlign: 'center'}}>{role === 'control' ? 'Crea un PIN de 4 dígitos para tu sala:' : 'Ingresa el PIN de 4 dígitos del control:'}</p>
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
            {/* ALERTA GLOBAL TOAST */}
            {toastMsg && <div className="custom-toast">{toastMsg}</div>}

            {/* MODAL PARA COPIAR ENLACES */}
            {showLinkModal && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal-content">
                        <h3 style={{marginTop: 0, color: 'var(--accent)', fontSize: '1.5rem'}}>{modalTitle}</h3>
                        <p style={{color: 'var(--text-muted)'}}>Comparte este enlace a través de WhatsApp o genera un QR:</p>
                        <div style={{display: 'flex', gap: '10px', marginTop: '20px', marginBottom: '25px'}}>
                            <input type="text" readOnly value={modalUrl} style={{flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none', fontSize: '0.9rem'}} />
                            <button className="btn-start" style={{margin: 0, padding: '10px 15px'}} onClick={() => { navigator.clipboard.writeText(modalUrl); showToast("¡Enlace copiado al portapapeles!"); }}>
                                <i className="fas fa-copy"></i> Copiar
                            </button>
                        </div>
                        <button className="glass-btn" onClick={() => setShowLinkModal(false)} style={{width: '100%'}}>Cerrar Ventana</button>
                    </div>
                </div>
            )}

            {/* =========================================
                VISTAS DEL JUEZ (EVALUACIÓN DE CORO)
                ========================================= */}
            {role === 'juez' && (
                <section className="screen" style={{ flexDirection: 'column', alignItems: 'center', background: 'var(--dark-bg)', overflowY: 'auto', padding: '20px' }}>
                    <div className="particles"></div>
                    <img src="/public/logo.png" alt="Logo" style={{width: '80px', height: '80px', borderRadius: '50%', marginBottom: '15px', zIndex: 10}} />
                    
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
                                    
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '10px'}}>
                                        <div style={{flex: 1, paddingRight: '15px'}}>
                                            <div style={{color: 'white', fontWeight: 'bold'}}>1. Ritmo y Sincronización</div>
                                            <div style={{color: 'gray', fontSize: '0.8rem'}}>Entradas y salidas a tiempo, pulso constante. (Máx 30 pts)</div>
                                        </div>
                                        <input type="number" inputMode="numeric" pattern="[0-9]*" placeholder="0-30" value={juezRitmo} onChange={(e) => handleJuezScoreChange(setJuezRitmo, 30, e.target.value)} style={{width: '70px', padding: '12px', borderRadius: '8px', border: '1px solid var(--accent)', background: 'rgba(0,0,0,0.8)', color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'center', outline: 'none'}} />
                                    </div>

                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '10px'}}>
                                        <div style={{flex: 1, paddingRight: '15px'}}>
                                            <div style={{color: 'white', fontWeight: 'bold'}}>2. Volumen y Proyección</div>
                                            <div style={{color: 'gray', fontSize: '0.8rem'}}>Sonido suficiente y adecuado al espacio. (Máx 30 pts)</div>
                                        </div>
                                        <input type="number" inputMode="numeric" pattern="[0-9]*" placeholder="0-30" value={juezVolumen} onChange={(e) => handleJuezScoreChange(setJuezVolumen, 30, e.target.value)} style={{width: '70px', padding: '12px', borderRadius: '8px', border: '1px solid var(--accent)', background: 'rgba(0,0,0,0.8)', color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'center', outline: 'none'}} />
                                    </div>

                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '10px'}}>
                                        <div style={{flex: 1, paddingRight: '15px'}}>
                                            <div style={{color: 'white', fontWeight: 'bold'}}>3. Coordinación del Grupo</div>
                                            <div style={{color: 'gray', fontSize: '0.8rem'}}>Unidad en movimientos y trabajo en equipo. (Máx 40 pts)</div>
                                        </div>
                                        <input type="number" inputMode="numeric" pattern="[0-9]*" placeholder="0-40" value={juezCoordinacion} onChange={(e) => handleJuezScoreChange(setJuezCoordinacion, 40, e.target.value)} style={{width: '70px', padding: '12px', borderRadius: '8px', border: '1px solid var(--accent)', background: 'rgba(0,0,0,0.8)', color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'center', outline: 'none'}} />
                                    </div>

                                    <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 15px', fontSize: '1.2rem', fontWeight: 'bold', color: 'white', background: 'rgba(255,215,0,0.1)', borderRadius: '10px', border: '1px solid var(--accent)'}}>
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
                    {/* LOGIN DEL LÍDER (Directo al tocar) */}
                    {screen === 'lider-login' && (
                        <section className="screen" style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--dark-bg)' }}>
                            <div className="particles"></div>
                            <img src="/public/logo.png" alt="Logo" style={{width: '100px', height: '100px', borderRadius: '50%', marginBottom: '15px', zIndex: 10}} />
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
                            <section className="screen" style={{ flexDirection: 'column', alignItems: 'center', background: 'var(--dark-bg)', padding: '30px 20px' }}>
                                <div className="particles"></div>
                                <img src="/public/logo.png" alt="Watermark" className="watermark-logo" style={{opacity: 0.05}} />

                                <div style={{display: 'flex', alignItems: 'center', gap: '15px', zIndex: 10, marginBottom: '40px', background: 'rgba(0,0,0,0.5)', padding: '10px 20px', borderRadius: '30px', border: `1px solid ${colorMap[liderLogueado.equipo]}`}}>
                                    <img src={liderLogueado.fotoUrl} style={{width: '50px', height: '50px', borderRadius: '50%', border: `2px solid ${colorMap[liderLogueado.equipo]}`}} alt="" />
                                    <div>
                                        <div style={{fontWeight: 'bold', fontSize: '1.1rem', color: 'white'}}>{liderLogueado.nombre}</div>
                                        <div style={{color: colorMap[liderLogueado.equipo], fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Líder Equipo {liderLogueado.equipo}</div>
                                    </div>
                                </div>

                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', width: '100%', maxWidth: '600px', zIndex: 10}}>
                                    {/* Módulo Registro (Siempre activo) */}
                                    <div className="cat-card" onClick={() => setScreen('lider-registro')}>
                                        <i className="fas fa-user-plus"></i><h3>Registrar Campistas</h3>
                                        <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0}}>Inscribe a tu propio equipo</p>
                                    </div>
                                    
                                    {/* Módulo Verso */}
                                    <div className="cat-card" onClick={() => { if(isVersoActive) setScreen('lider-verso'); else showToast("Esperando activación del administrador."); }} style={{opacity: isVersoActive ? 1 : 0.6, cursor: isVersoActive ? 'pointer' : 'not-allowed', position: 'relative'}}>
                                        <div style={{position: 'absolute', top: '15px', right: '15px'}}>
                                            <span style={{width: '12px', height: '12px', borderRadius: '50%', background: dotColorVerso, boxShadow: `0 0 10px ${dotColorVerso}`, display: 'inline-block'}}></span>
                                        </div>
                                        <i className="fas fa-book-open"></i><h3>Evaluar Verso</h3>
                                        <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0}}>{isVersoCompleted ? 'Evaluación guardada' : isVersoActive ? 'Califica a otro equipo' : 'Esperando activación...'}</p>
                                    </div>

                                    {/* Módulo Mejor Campista */}
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
                        <section className="screen" style={{ flexDirection: 'column', alignItems: 'center', background: 'var(--dark-bg)', overflowY: 'auto', padding: '20px' }}>
                            <div className="particles"></div>
                            
                            <div style={{display: 'flex', width: '100%', maxWidth: '400px', justifyContent: 'space-between', zIndex: 10, marginBottom: '20px'}}>
                                <button className="glass-btn" onClick={() => setScreen('lider-dashboard')}><i className="fas fa-arrow-left"></i> Volver</button>
                                <h2 style={{color: colorMap[liderLogueado.equipo], margin: 0, textTransform: 'uppercase'}}>Equipo {liderLogueado.equipo}</h2>
                            </div>

                            <form onSubmit={agregarAListaLocal} style={{display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '400px', zIndex: 10, background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '15px', borderTop: `4px solid ${colorMap[liderLogueado.equipo]}`, backdropFilter: 'blur(10px)'}}>
                                <h3 style={{margin: 0, color: 'white', textAlign: 'center'}}>Añadir a la lista</h3>
                                
                                {showCamera ? (
                                    <div className="camera-container">
                                        <video ref={videoRef} autoPlay playsInline className="camera-video" />
                                        <div style={{display: 'flex', gap: '10px'}}>
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
                                        
                                        <div style={{display: 'flex', gap: '10px'}}>
                                            <button type="button" className="glass-btn" onClick={startCamera}><i className="fas fa-camera"></i> Cámara</button>
                                            <label className="glass-btn" style={{cursor: 'pointer', margin: 0}}>
                                                <i className="fas fa-upload"></i> Subir
                                                <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => { if(e.target.files[0]) { setCamperFotoObj(e.target.files[0]); setCamperFotoPreview(URL.createObjectURL(e.target.files[0])); } }} />
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <div style={{display: 'flex', gap: '10px'}}>
                                    <input type="number" placeholder="N°" value={camperNum} onChange={(e) => setCamperNum(e.target.value)} style={{flex: '1', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none'}} />
                                    <input type="number" placeholder="Edad" value={camperEdad} onChange={(e) => setCamperEdad(e.target.value)} style={{flex: '2', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none'}} />
                                </div>
                                <input type="text" placeholder="Nombre y Apellidos" value={camperNombre} onChange={(e) => setCamperNombre(e.target.value)} style={{padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: 'white', outline: 'none'}} />
                                
                                <button type="submit" className="glass-btn" style={{borderColor: 'var(--accent)', color: 'var(--accent)'}}>
                                    <i className="fas fa-plus"></i> Añadir a la lista
                                </button>
                            </form>

                            {localCampers.length > 0 && (
                                <div style={{width: '100%', maxWidth: '400px', zIndex: 10, marginTop: '20px'}}>
                                    <h3 style={{color: 'white', textAlign: 'center'}}>Lista Pendiente ({localCampers.length})</h3>
                                    {localCampers.map((c, i) => (
                                        <div key={i} className="local-camper-item">
                                            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                                <img src={c.fotoPreview} style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover'}} alt="" />
                                                <div><div style={{color: 'white', fontWeight: 'bold'}}>#{c.numero} {c.nombre}</div><div style={{color: 'gray', fontSize: '0.8rem'}}>{c.edad} años</div></div>
                                            </div>
                                            <button className="glass-btn" style={{padding: '5px 10px', color: '#e74c3c', borderColor: 'transparent'}} onClick={() => setLocalCampers(localCampers.filter((_, index) => index !== i))}><i className="fas fa-trash"></i></button>
                                        </div>
                                    ))}
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
                                                <div key={c.id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.4)', padding: '10px 15px', borderRadius: '10px'}}>
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
                VISTAS DEL ANFITRIÓN / PROYECTOR
                ========================================= */}
            {screen === 'welcome' && (
                <section className="screen" id="welcome-screen" style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--dark-bg)', textAlign: 'center' }}>
                    <div className="particles"></div>
                    <div className="hero-content">
                        <div className="logo-container"><img src="/public/logo.png" alt="Logo" className="logo-img" /></div>
                        <div className="verse-box"><span>{verseText}</span><span className="cursor"></span></div>
                        <div style={{ marginTop: '10px' }}><h1 className="main-title">Mini Campamento<br /><span style={{ color: 'var(--accent)' }}>2026</span></h1></div>
                        
                        {role === 'control' && (
                            <div style={{ display: 'flex', gap: '15px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <button className="btn-start" onClick={() => setScreen('menu')}><i className="fas fa-music"></i> Himnario</button>
                                <button className="btn-start"  onClick={() => setScreen('camp-admin')}><i className="fas fa-campground"></i> Campamento</button>
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
                    </div>
                </section>
            )}

            {screen === 'menu' && role === 'control' && (
                <section className="screen inner-screen">
                    <div className="particles"></div>
                    <img src="/public/logo.png" alt="Watermark" className="watermark-logo" />
                    <div className="modern-header">
                        <div className="header-row">
                            <button className="glass-btn" onClick={() => setScreen('welcome')}><i className="fas fa-arrow-left"></i> Inicio</button>
                            <h2>Himnarios</h2>
                            <div className="status-led-container"><span className={`led-dot ${proyectorConectado ? 'led-on' : 'led-off'}`}></span><span className="status-text">{proyectorConectado ? "LIVE" : "OFF"}</span></div>
                        </div>
                        <div className="search-container">
                            <i className="fas fa-search search-icon"></i><input type="text" id="searchInput" placeholder="Buscar número o título..." onKeyDown={handleSearch} />
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
            {screen === 'camp-admin' && role === 'control' && (
                <section className="screen camp-layout">
                    <div className="particles"></div>
                    <div className="camp-sidebar">
                        <div className="camp-sidebar-header">
                            <button className="glass-btn" style={{width: '100%', marginBottom: '15px'}} onClick={() => setScreen('welcome')}><i className="fas fa-arrow-left"></i> Volver al Menú</button>
                            <h2 style={{color: 'var(--accent)', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.2rem'}}>Campamento</h2>
                        </div>
                        <button className={`camp-nav-btn ${activeCampModule === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveCampModule('dashboard')}><i className="fas fa-home"></i> Inicio</button>
                        <button className={`camp-nav-btn ${activeCampModule === 'lideres' ? 'active' : ''}`} onClick={() => setActiveCampModule('lideres')}><i className="fas fa-user-tie"></i> Líderes</button>
                        <button className={`camp-nav-btn ${activeCampModule === 'registro' ? 'active' : ''}`} onClick={() => setActiveCampModule('registro')}><i className="fas fa-user-plus"></i> Registro</button>
                        <button className={`camp-nav-btn ${activeCampModule === 'eval-verso' ? 'active' : ''}`} onClick={() => { setActiveCampModule('eval-verso'); setTeamVersoDetailMode(null); }}><i className="fas fa-book-open"></i> Eval. Verso</button>
                        <button className={`camp-nav-btn ${activeCampModule === 'eval-coro' ? 'active' : ''}`} onClick={() => { setActiveCampModule('eval-coro'); setTeamCoroDetailMode(null); }}><i className="fas fa-music"></i> Eval. Coro</button>
                        <button className={`camp-nav-btn ${activeCampModule === 'mejores' ? 'active' : ''}`} onClick={() => setActiveCampModule('mejores')}><i className="fas fa-star"></i> Mejores Campistas</button>
                        <button className={`camp-nav-btn ${activeCampModule === 'videos' ? 'active' : ''}`} onClick={() => setActiveCampModule('videos')}><i className="fas fa-video"></i> Coros (Videos)</button>
                        <button className={`camp-nav-btn ${activeCampModule === 'esgrima' ? 'active' : ''}`} onClick={() => setActiveCampModule('esgrima')}><i className="fas fa-scroll"></i> Esgrima</button>
                        <button className={`camp-nav-btn ${activeCampModule === 'dinamicas' ? 'active' : ''}`} onClick={() => setActiveCampModule('dinamicas')}><i className="fas fa-running"></i> Dinámicas</button>
                        <button className={`camp-nav-btn ${activeCampModule === 'subasta' ? 'active' : ''}`} onClick={() => setActiveCampModule('subasta')}><i className="fas fa-gavel"></i> Liga Subasta</button>
                        <button className={`camp-nav-btn ${activeCampModule === 'rescate' ? 'active' : ''}`} onClick={() => setActiveCampModule('rescate')}><i className="fas fa-life-ring"></i> Rescate Puntos</button>
                        <button className={`camp-nav-btn ${activeCampModule === 'ganador' ? 'active' : ''}`} onClick={() => setActiveCampModule('ganador')} style={{marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px'}}><i className="fas fa-trophy" style={{color: 'var(--accent)'}}></i> <span style={{color: 'var(--accent)'}}>Equipo Ganador</span></button>
                    </div>

                    <div className="camp-main-content">
                        <img src="/public/logo.png" alt="Watermark" className="watermark-logo" style={{opacity: 0.03}} />
                        
                        {activeCampModule === 'dashboard' && (
                            <div className="camp-dashboard-view">
                                <img src="/public/logo.png" alt="Logo Campamento" className="camp-dashboard-logo" />
                                <h1 className="main-title" style={{fontSize: '3rem', margin: 0}}>Gestor de Campamento</h1>
                            </div>
                        )}

                        {/* MÓDULO 1: LÍDERES Y CONTROL DE ACTIVIDADES */}
                        {activeCampModule === 'lideres' && (
                            <div style={{zIndex: 10}}>
                                <h2 style={{ fontSize: '2rem', margin: '0 0 20px 0' }}><i className="fas fa-user-tie" style={{color: 'var(--accent)', marginRight: '10px'}}></i>Gestión de Líderes</h2>
                                <form onSubmit={handleLiderSubmit} style={{display: 'flex', gap: '15px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '15px', marginBottom: '30px', flexWrap: 'wrap'}}>
                                    <label style={{cursor: 'pointer'}}>
                                        {nuevoLider.fotoPreview ? <img src={nuevoLider.fotoPreview} style={{width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover'}} alt=""/> : <div style={{width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><i className="fas fa-camera"></i></div>}
                                        <input type="file" style={{display: 'none'}} accept="image/*" onChange={(e) => { if(e.target.files[0]) { setNuevoLider({...nuevoLider, fotoObj: e.target.files[0], fotoPreview: URL.createObjectURL(e.target.files[0])}) } }} />
                                    </label>
                                    <input type="text" placeholder="Nombre del Líder" value={nuevoLider.nombre} onChange={(e) => setNuevoLider({...nuevoLider, nombre: e.target.value})} style={{padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid gray', outline: 'none', minWidth: '200px', flex: 1}} />
                                    <select value={nuevoLider.equipo} onChange={(e) => setNuevoLider({...nuevoLider, equipo: e.target.value})} style={{padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid gray', outline: 'none'}}>
                                        <option value="">-- Asignar Equipo --</option>
                                        {EQUIPOS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                                    </select>
                                    <button type="submit" disabled={isSubmittingLider} className="btn-start" style={{margin: 0}}>{isSubmittingLider ? '...' : 'Crear Líder'}</button>
                                </form>

                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px'}}>
                                    {lideres.map(l => (
                                        <div key={l.id} style={{display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '12px', borderLeft: `5px solid ${colorMap[l.equipo]}`}}>
                                            <img src={l.fotoUrl} style={{width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover'}} alt=""/>
                                            <div><div style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{l.nombre}</div><div style={{color: colorMap[l.equipo], fontSize: '0.8rem', textTransform: 'uppercase'}}>Líder Equipo {l.equipo}</div></div>
                                        </div>
                                    ))}
                                </div>

                                {/* PANEL DE CONTROL DE ACTIVIDADES */}
                                <div style={{marginTop: '40px', background: 'rgba(255,255,255,0.05)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)'}}>
                                    <h3 style={{color: 'var(--accent)', margin: '0 0 5px 0'}}>Activación de Actividades</h3>
                                    <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px'}}>Habilita los módulos en los celulares de los líderes.</p>
                                    
                                    <div style={{marginBottom: '20px'}}>
                                        <h4 style={{color: 'white', margin: '0 0 10px 0'}}><i className="fas fa-book-open"></i> Eval. Verso</h4>
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

                                    <div style={{marginBottom: '20px'}}>
                                        <h4 style={{color: 'white', margin: '0 0 10px 0'}}><i className="fas fa-star"></i> Mejores Campistas</h4>
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
                            </div>
                        )}

                        {/* MÓDULO 2: REGISTRO */}
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

                        {/* MÓDULO 3: EVALUACIÓN DE VERSO (ANFITRIÓN) */}
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
                                    if (evalData && evalData.scores) {
                                        teamCampers.forEach(c => { puntosGanados += evalData.scores[c.id] || 0; });
                                    }
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

                        {/* MÓDULO 4: EVALUACIÓN DE CORO (ANFITRIÓN) */}
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
                                            
                                            <div style={{marginTop: '20px', overflowX: 'auto'}}>
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

                        {/* MÓDULO 5: MEJORES CAMPISTAS (ANFITRIÓN) */}
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

                        {['esgrima', 'dinamicas', 'subasta', 'rescate', 'ganador'].includes(activeCampModule) && (
                            <div className="camp-dashboard-view">
                                <i className="fas fa-tools" style={{fontSize: '4rem', color: 'rgba(255,255,255,0.3)', marginBottom: '20px'}}></i>
                                <h2 style={{fontSize: '2.5rem', margin: 0, textTransform: 'capitalize'}}>{activeCampModule.replace('-', ' ')}</h2>
                                <p style={{color: 'var(--text-muted)'}}>Módulo en desarrollo...</p>
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