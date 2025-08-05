import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    setDoc,
    addDoc,
    onSnapshot,
    collection,
    deleteDoc,
} from 'firebase/firestore';

// Global variables provided by the environment
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const App = () => {
    // State for user authentication and data
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // State to manage the active view (page)
    const [activeView, setActiveView] = useState('login'); // 'login', 'register', 'forgotPassword', 'verifyEmail', 'main'

    // Form states for login/registration
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // States for the invoice generator
    const [savedInvoices, setSavedInvoices] = useState([]);
    const [userSettings, setUserSettings] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const [invoice, setInvoice] = useState({
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().slice(0, 10),
        dueDate: '',
        logoUrl: '',
        sender: {
            name: '',
            address: '',
            city: '',
            postalCode: '',
            country: '',
        },
        recipient: {
            name: '',
            address: '',
            city: '',
            postalCode: '',
            country: '',
        },
        items: [{ description: '', quantity: 1, unitPrice: 0 }],
        currency: 'USD',
        taxRate: 0,
    });

    // UI states
    const [shareLink, setShareLink] = useState('');
    const [showShareModal, setShowShareModal] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [logoLoadError, setLogoLoadError] = useState(false);
    const [subtotal, setSubtotal] = useState(0);
    const [total, setTotal] = useState(0);
    const [alertMessage, setAlertMessage] = useState('');

    // --- Auth State Listener ---
    useEffect(() => {
        // Set up the listener to watch for auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setUserId(currentUser.uid);
                // Navigate to the main app if authenticated and email is verified
                if (currentUser.emailVerified) {
                    setActiveView('main');
                } else {
                    setActiveView('verifyEmail');
                }
            } else {
                setUser(null);
                setUserId(null);
                setActiveView('login');
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // --- Data Fetching and Real-time Updates ---
    // This effect fetches user data only when authenticated
    useEffect(() => {
        if (!userId) return;

        // Listen for user settings
        const settingsDocPath = `/artifacts/${appId}/users/${userId}/settings/companyDetails`;
        const unsubscribeSettings = onSnapshot(doc(db, settingsDocPath), (docSnapshot) => {
            if (docSnapshot.exists()) {
                const settingsData = docSnapshot.data();
                setUserSettings(settingsData);
                setInvoice((prev) => ({
                    ...prev,
                    sender: { ...settingsData.sender },
                    logoUrl: settingsData.logoUrl,
                }));
            } else {
                setUserSettings(null);
            }
        }, (error) => {
            console.error("Error fetching user settings:", error);
        });

        // Listen for user invoices
        const invoicesCollectionPath = `/artifacts/${appId}/users/${userId}/invoices`;
        const unsubscribeFirestore = onSnapshot(collection(db, invoicesCollectionPath), (snapshot) => {
            const newInvoices = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setSavedInvoices(newInvoices);
            if (selectedInvoice && !newInvoices.find(inv => inv.id === selectedInvoice.id)) {
                setSelectedInvoice(null);
            }
        }, (error) => {
            console.error("Error fetching invoices:", error);
        });

        // Cleanup subscriptions on unmount
        return () => {
            unsubscribeSettings();
            unsubscribeFirestore();
        };
    }, [userId, selectedInvoice]);

    // Recalculate totals whenever invoice items or tax rate changes
    useEffect(() => {
        const newSubtotal = invoice.items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0
        );
        const taxAmount = newSubtotal * (invoice.taxRate / 100);
        setSubtotal(newSubtotal);
        setTotal(newSubtotal + taxAmount);
    }, [invoice.items, invoice.taxRate]);


    // --- Authentication Handlers ---
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // The onAuthStateChanged listener will handle navigation
        } catch (error) {
            setAlertMessage(error.message);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setAlertMessage('Passwords do not match.');
            return;
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);
            setAlertMessage('Registration successful! Please check your email to verify your account.');
            setActiveView('verifyEmail');
        } catch (error) {
            setAlertMessage(error.message);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        try {
            await sendPasswordResetEmail(auth, email);
            setAlertMessage('Password reset email sent. Please check your inbox.');
            setActiveView('login');
        } catch (error) {
            setAlertMessage(error.message);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setAlertMessage('You have been logged out.');
        } catch (error) {
            setAlertMessage(error.message);
        }
    };

    // --- Invoice & UI Handlers (Same as previous version) ---
    const handleInvoiceChange = (e) => {
        const { name, value } = e.target;
        setInvoice((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddressChange = (e, type) => {
        const { name, value } = e.target;
        setInvoice((prev) => ({
            ...prev,
            [type]: { ...prev[type], [name]: value },
        }));
    };

    const handleItemChange = (e, index) => {
        const { name, value } = e.target;
        const newItems = [...invoice.items];
        newItems[index] = { ...newItems[index], [name]: name === 'description' ? value : parseFloat(value) || 0 };
        setInvoice((prev) => ({ ...prev, items: newItems }));
    };

    const handleAddItem = () => {
        setInvoice((prev) => ({
            ...prev,
            items: [...prev.items, { description: '', quantity: 1, unitPrice: 0 }],
        }));
    };

    const handleRemoveItem = (index) => {
        const newItems = invoice.items.filter((_, i) => i !== index);
        setInvoice((prev) => ({ ...prev, items: newItems }));
    };

    const createNewInvoice = () => {
        setInvoice({
            invoiceNumber: '',
            invoiceDate: new Date().toISOString().slice(0, 10),
            dueDate: '',
            logoUrl: userSettings ? userSettings.logoUrl : '',
            sender: userSettings ? { ...userSettings.sender } : {
                name: '',
                address: '',
                city: '',
                postalCode: '',
                country: '',
            },
            recipient: {
                name: '',
                address: '',
                city: '',
                postalCode: '',
                country: '',
            },
            items: [{ description: '', quantity: 1, unitPrice: 0 }],
            currency: 'USD',
            taxRate: 0,
        });
        setAlertMessage('New invoice created!');
    };

    const saveSettings = async (e) => {
        e.preventDefault();
        if (!userId) {
            setAlertMessage('User not authenticated. Please try again.');
            return;
        }

        try {
            const settingsDocPath = `/artifacts/${appId}/users/${userId}/settings/companyDetails`;
            const settingsData = {
                sender: invoice.sender,
                logoUrl: invoice.logoUrl,
            };
            await setDoc(doc(db, settingsDocPath), settingsData);
            setAlertMessage('User settings saved successfully!');
        } catch (e) {
            console.error("Error saving user settings: ", e);
            setAlertMessage('Failed to save settings. Please check the console for details.');
        }
    };

    const saveInvoice = async () => {
        if (!userId) {
            setAlertMessage('User not authenticated. Please try again.');
            return;
        }
        const { id, ...invoiceToSave } = invoice;
        try {
            const invoiceRef = collection(db, `/artifacts/${appId}/users/${userId}/invoices`);
            await addDoc(invoiceRef, invoiceToSave);
            setAlertMessage('Invoice saved successfully!');
        } catch (e) {
            console.error("Error adding document: ", e);
            setAlertMessage('Failed to save invoice. Please check the console for details.');
        }
    };

    const loadInvoice = (savedInvoice) => {
        setInvoice(savedInvoice);
        setAlertMessage('Invoice loaded to generator!');
        setActiveView('generator');
    };

    const viewInvoiceDetails = (invoice) => {
        setSelectedInvoice(invoice);
    };

    const deleteInvoice = async (invoiceId) => {
        if (!userId) {
            setAlertMessage('User not authenticated. Please try again.');
            return;
        }
        try {
            const docRef = doc(db, `/artifacts/${appId}/users/${userId}/invoices`, invoiceId);
            await deleteDoc(docRef);
            setAlertMessage('Invoice deleted successfully!');
        } catch (e) {
            console.error("Error deleting document: ", e);
            setAlertMessage('Failed to delete invoice.');
        }
    };

    const downloadPdf = async () => {
        setDownloading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!window.html2canvas || !window.jspdf) {
            console.error('html2canvas or jsPDF not loaded');
            setDownloading(false);
            return;
        }
        const { jsPDF } = window.jspdf;
        const invoiceElement = document.getElementById('invoice-document');
        const width = invoiceElement.offsetWidth;
        const height = invoiceElement.offsetHeight;
        const scale = 2;
        try {
            const canvas = await window.html2canvas(invoiceElement, {
                scale: scale,
                allowTaint: true,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (height * pdfWidth) / width;
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setDownloading(false);
        }
    };

    const createShareLink = () => {
        if (!invoice.id) {
            setAlertMessage('Please save the invoice before sharing.');
            return;
        }
        const baseUrl = window.location.href.split('?')[0];
        const link = `${baseUrl}?invoiceId=${invoice.id}`;
        setShareLink(link);
        setShowShareModal(true);
    };

    const handleCloseShareModal = () => {
        setShowShareModal(false);
        setShareLink('');
    };

    const copyToClipboard = () => {
        const shareLinkElement = document.getElementById('share-link');
        if (shareLinkElement) {
            shareLinkElement.select();
            document.execCommand('copy');
            setAlertMessage('Link copied to clipboard!');
        }
    };

    // Custom Alert Modal component
    const CustomAlert = ({ message, onClose }) => (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Notification</h3>
                <p className="text-gray-700 mb-4">{message}</p>
                <button onClick={onClose} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300">
                    OK
                </button>
            </div>
        </div>
    );

    // Read-only invoice view component
    const ReadOnlyInvoice = ({ invoice, onEdit, onDelete }) => {
        const invoiceSubtotal = invoice.items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0
        );
        const invoiceTotal = invoiceSubtotal + (invoiceSubtotal * (invoice.taxRate / 100));
        return (
            <div className="bg-white p-6 md:p-10 rounded-xl shadow-2xl border border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start mb-10 border-b pb-6">
                    <div className="flex items-center mb-4 md:mb-0">
                        {invoice.logoUrl ? (
                            <img src={invoice.logoUrl} alt="Company Logo" className="max-h-16 h-auto object-contain mr-4 rounded-lg shadow-sm" />
                        ) : (
                            <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded-lg mr-4">
                                <span className="text-xs text-gray-500 text-center">No Logo</span>
                            </div>
                        )}
                        <h2 className="text-3xl md:text-4xl font-extrabold text-blue-800">INVOICE</h2>
                    </div>
                    <div className="flex flex-col items-end text-sm">
                        <p className="mb-2"><span className="font-semibold text-gray-700 mr-2 w-28 text-right">Invoice #:</span> {invoice.invoiceNumber || 'N/A'}</p>
                        <p className="mb-2"><span className="font-semibold text-gray-700 mr-2 w-28 text-right">Date:</span> {invoice.invoiceDate}</p>
                        <p><span className="font-semibold text-gray-700 mr-2 w-28 text-right">Due Date:</span> {invoice.dueDate}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 text-sm">
                    <div>
                        <h3 className="text-lg font-bold text-gray-700 mb-4">From:</h3>
                        <p>{invoice.sender.name}</p>
                        <p>{invoice.sender.address}</p>
                        <p>{invoice.sender.city}, {invoice.sender.postalCode}</p>
                        <p>{invoice.sender.country}</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-700 mb-4">Bill To:</h3>
                        <p>{invoice.recipient.name}</p>
                        <p>{invoice.recipient.address}</p>
                        <p>{invoice.recipient.city}, {invoice.recipient.postalCode}</p>
                        <p>{invoice.recipient.country}</p>
                    </div>
                </div>
                <div className="overflow-x-auto mb-6">
                    <table className="min-w-full bg-white rounded-lg overflow-hidden">
                        <thead className="bg-blue-600 text-white">
                        <tr>
                            <th className="py-3 px-4 text-left font-bold">Description</th>
                            <th className="py-3 px-4 text-center font-bold w-24">Qty</th>
                            <th className="py-3 px-4 text-right font-bold w-32">Unit Price</th>
                            <th className="py-3 px-4 text-right font-bold w-32">Amount</th>
                        </tr>
                        </thead>
                        <tbody>
                        {invoice.items.map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="p-4 text-sm">{item.description}</td>
                                <td className="p-4 text-sm text-center">{item.quantity}</td>
                                <td className="p-4 text-sm text-right">{invoice.currency} {item.unitPrice.toFixed(2)}</td>
                                <td className="p-4 text-sm font-semibold text-gray-800 text-right">
                                    {invoice.currency} {(item.quantity * item.unitPrice).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end mt-10">
                    <div className="w-full md:w-1/2 space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-gray-700">Subtotal:</span>
                            <span className="text-gray-800 font-bold">{invoice.currency} {invoiceSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-gray-700">Tax (%):</span>
                            <span className="text-gray-800 font-bold">{invoice.taxRate}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-extrabold text-blue-800 border-t-2 border-blue-200 pt-4">
                            <span>Total:</span>
                            <span>{invoice.currency} {invoiceTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                    <button
                        onClick={() => onEdit(invoice)}
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit Invoice
                    </button>
                    <button
                        onClick={() => onDelete(invoice.id)}
                        className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-red-600 transition duration-300 flex items-center justify-center text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m1-3h6" />
                        </svg>
                        Delete
                    </button>
                </div>
            </div>
        );
    };


    // --- Main Render Function ---
    // Renders the appropriate view based on the current state
    const renderView = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-gray-100">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            );
        }

        switch (activeView) {
            case 'login':
                return (
                    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl space-y-6">
                            <h2 className="text-3xl font-extrabold text-center text-blue-800">Login</h2>
                            <form onSubmit={handleLogin} className="space-y-4">
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
                                >
                                    Sign In
                                </button>
                            </form>
                            <div className="flex justify-between text-sm">
                                <button onClick={() => setActiveView('register')} className="text-blue-600 hover:underline">
                                    Don't have an account? Sign up
                                </button>
                                <button onClick={() => setActiveView('forgotPassword')} className="text-blue-600 hover:underline">
                                    Forgot Password?
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'register':
                return (
                    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl space-y-6">
                            <h2 className="text-3xl font-extrabold text-center text-blue-800">Register</h2>
                            <form onSubmit={handleRegister} className="space-y-4">
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
                                >
                                    Register
                                </button>
                            </form>
                            <div className="text-center">
                                <button onClick={() => setActiveView('login')} className="text-blue-600 hover:underline">
                                    Already have an account? Sign in
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'forgotPassword':
                return (
                    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl space-y-6">
                            <h2 className="text-3xl font-extrabold text-center text-blue-800">Forgot Password</h2>
                            <p className="text-center text-gray-600">Enter your email and we'll send you a password reset link.</p>
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
                                >
                                    Send Reset Link
                                </button>
                            </form>
                            <div className="text-center">
                                <button onClick={() => setActiveView('login')} className="text-blue-600 hover:underline">
                                    Back to Login
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'verifyEmail':
                return (
                    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl text-center space-y-6">
                            <h2 className="text-3xl font-extrabold text-blue-800">Verify Your Email</h2>
                            <p className="text-gray-600">A verification link has been sent to your email address. Please click the link to activate your account. You may need to check your spam folder.</p>
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-red-700 transition duration-300"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                );
            case 'main':
                return (
                    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
                        {/* --- Custom Alert Modal --- */}
                        {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage('')} />}

                        {/* --- Share Modal --- */}
                        {showShareModal && (
                            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                                <div className="relative bg-white p-6 md:p-8 rounded-xl shadow-2xl max-w-lg w-full mx-4 transform transition-all">
                                    <button
                                        onClick={handleCloseShareModal}
                                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Share Invoice</h3>
                                    <p className="text-gray-700 mb-4 text-sm md:text-base">
                                        Copy the link below and share it with your client.
                                    </p>
                                    <div className="flex flex-col md:flex-row gap-2 mb-4">
                                        <input
                                            type="text"
                                            id="share-link"
                                            readOnly
                                            value={shareLink}
                                            className="flex-grow bg-gray-100 border border-gray-300 rounded-lg py-2 px-4 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={copyToClipboard}
                                            className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center text-sm md:text-base"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-2m-4-4l-4 4m0 0l-4-4m4 4V8" />
                                            </svg>
                                            Copy Link
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* --- Navigation Bar --- */}
                        <nav className="bg-white shadow-lg sticky top-0 z-40">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                <div className="flex items-center justify-between h-16">
                                    <h1 className="text-2xl font-bold text-blue-800">Invoice App</h1>
                                    <div className="flex items-center space-x-2 sm:space-x-4">
                                        {/* Navigation buttons */}
                                        <button onClick={() => setActiveView('generator')} className={`py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${activeView === 'generator' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'}`}>Generator</button>
                                        <button onClick={() => { setActiveView('saved'); setSelectedInvoice(null); }} className={`py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${activeView === 'saved' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'}`}>Saved Invoices</button>
                                        <button onClick={() => setActiveView('settings')} className={`py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${activeView === 'settings' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'}`}>Settings</button>
                                        <button onClick={handleLogout} className="py-2 px-3 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition duration-300">
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </nav>
                        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                            <p className="text-center text-gray-600 mb-6 text-sm">
                                User: <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded-md">{user?.email || 'N/A'}</span>
                            </p>
                            {/* Conditional Rendering based on activeView state */}
                            {activeView === 'generator' && (
                                <div>
                                    <h2 className="text-3xl font-extrabold text-center text-blue-800 mb-6">Invoice Generator</h2>
                                    <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
                                        <button onClick={downloadPdf} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 transform hover:scale-105 transition duration-300 flex items-center justify-center text-lg" disabled={downloading}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            {downloading ? 'Downloading...' : 'Download PDF'}
                                        </button>
                                        <button onClick={saveInvoice} className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-green-700 transform hover:scale-105 transition duration-300 flex items-center justify-center text-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2m-8-2h6m-6-4h6m-8-2v4m4-4V7" /></svg>
                                            Save Invoice
                                        </button>
                                        <button onClick={createShareLink} className="bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-800 transform hover:scale-105 transition duration-300 flex items-center justify-center text-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.632l6.632-3.316m0 0a3 3 0 105.364-2.684 3 3 0 00-5.364 2.684zm-6.632 6.632a3 3 0 10-5.364 2.684 3 3 0 005.364-2.684z" /></svg>
                                            Share Invoice
                                        </button>
                                    </div>
                                    <div id="invoice-document" className="bg-white p-6 md:p-10 rounded-xl shadow-2xl border border-gray-200">
                                        <div className="flex flex-col md:flex-row justify-between items-start mb-10 border-b pb-6">
                                            <div className="flex items-center mb-4 md:mb-0">
                                                {invoice.logoUrl && !logoLoadError ? (<img src={invoice.logoUrl} alt="Company Logo" className="max-h-16 h-auto object-contain mr-4 rounded-lg shadow-sm" onError={() => setLogoLoadError(true)} />) : (
                                                    <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded-lg mr-4">
                                                        <span className="text-xs text-gray-500 text-center">No Logo</span>
                                                    </div>
                                                )}
                                                <h2 className="text-3xl md:text-4xl font-extrabold text-blue-800">INVOICE</h2>
                                            </div>
                                            <div className="flex flex-col items-end text-sm">
                                                <div className="flex items-center mb-2">
                                                    <label htmlFor="invoiceNumber" className="font-semibold text-gray-700 mr-2 w-28 text-right">Invoice #:</label>
                                                    <input type="text" id="invoiceNumber" name="invoiceNumber" value={invoice.invoiceNumber} onChange={handleInvoiceChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2 w-32 focus:ring-blue-500 focus:border-blue-500" placeholder="INV-001" />
                                                </div>
                                                <div className="flex items-center mb-2">
                                                    <label htmlFor="invoiceDate" className="font-semibold text-gray-700 mr-2 w-28 text-right">Date:</label>
                                                    <input type="date" id="invoiceDate" name="invoiceDate" value={invoice.invoiceDate} onChange={handleInvoiceChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2 w-32 focus:ring-blue-500 focus:border-blue-500" />
                                                </div>
                                                <div className="flex items-center">
                                                    <label htmlFor="dueDate" className="font-semibold text-gray-700 mr-2 w-28 text-right">Due Date:</label>
                                                    <input type="date" id="dueDate" name="dueDate" value={invoice.dueDate} onChange={handleInvoiceChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2 w-32 focus:ring-blue-500 focus:border-blue-500" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-700 mb-4">From:</h3>
                                                <div className="space-y-2">
                                                    <input type="text" name="name" value={invoice.sender.name} onChange={(e) => handleAddressChange(e, 'sender')} className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" placeholder="Your Company Name" />
                                                    <input type="text" name="address" value={invoice.sender.address} onChange={(e) => handleAddressChange(e, 'sender')} className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" placeholder="Street Address" />
                                                    <div className="flex space-x-2">
                                                        <input type="text" name="city" value={invoice.sender.city} onChange={(e) => handleAddressChange(e, 'sender')} className="w-1/2 bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" placeholder="City" />
                                                        <input type="text" name="postalCode" value={invoice.sender.postalCode} onChange={(e) => handleAddressChange(e, 'sender')} className="w-1/2 bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" placeholder="Postal Code" />
                                                    </div>
                                                    <input type="text" name="country" value={invoice.sender.country} onChange={(e) => handleAddressChange(e, 'sender')} className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" placeholder="Country" />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-700 mb-4">Bill To:</h3>
                                                <div className="space-y-2">
                                                    <input type="text" name="name" value={invoice.recipient.name} onChange={(e) => handleAddressChange(e, 'recipient')} className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" placeholder="Client Name" />
                                                    <input type="text" name="address" value={invoice.recipient.address} onChange={(e) => handleAddressChange(e, 'recipient')} className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" placeholder="Street Address" />
                                                    <div className="flex space-x-2">
                                                        <input type="text" name="city" value={invoice.recipient.city} onChange={(e) => handleAddressChange(e, 'recipient')} className="w-1/2 bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" placeholder="City" />
                                                        <input type="text" name="postalCode" value={invoice.recipient.postalCode} onChange={(e) => handleAddressChange(e, 'recipient')} className="w-1/2 bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" placeholder="Postal Code" />
                                                    </div>
                                                    <input type="text" name="country" value={invoice.recipient.country} onChange={(e) => handleAddressChange(e, 'recipient')} className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" placeholder="Country" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end mb-6">
                                            <div className="flex items-center space-x-2">
                                                <label htmlFor="currency" className="font-semibold text-gray-700">Currency:</label>
                                                <select id="currency" name="currency" value={invoice.currency} onChange={handleInvoiceChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2 w-24 focus:ring-blue-500 focus:border-blue-500">
                                                    <option value="USD">USD ($)</option>
                                                    <option value="EUR">EUR (€)</option>
                                                    <option value="GBP">GBP (£)</option>
                                                    <option value="JPY">JPY (¥)</option>
                                                    <option value="AUD">AUD ($)</option>
                                                    <option value="CAD">CAD ($)</option>
                                                    <option value="CHF">CHF (Fr)</option>
                                                    <option value="GHC">GHC (₵)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto mb-6">
                                            <table className="min-w-full bg-white rounded-lg overflow-hidden">
                                                <thead className="bg-blue-600 text-white">
                                                <tr>
                                                    <th className="py-3 px-4 text-left font-bold">Description</th>
                                                    <th className="py-3 px-4 text-center font-bold w-24">Qty</th>
                                                    <th className="py-3 px-4 text-right font-bold w-32">Unit Price</th>
                                                    <th className="py-3 px-4 text-right font-bold w-32">Amount</th>
                                                    <th className="py-3 px-4 w-16"></th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {invoice.items.map((item, index) => (
                                                    <tr key={index} className="border-b hover:bg-gray-50">
                                                        <td className="p-4">
                                                            <input type="text" name="description" value={item.description} onChange={(e) => handleItemChange(e, index)} className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Item description" />
                                                        </td>
                                                        <td className="p-4">
                                                            <input type="number" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(e, index)} className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm text-center focus:ring-blue-500 focus:border-blue-500" min="1" />
                                                        </td>
                                                        <td className="p-4">
                                                            <input type="number" name="unitPrice" value={item.unitPrice} onChange={(e) => handleItemChange(e, index)} className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm text-right focus:ring-blue-500 focus:border-blue-500" min="0" />
                                                        </td>
                                                        <td className="p-4 text-right text-sm font-semibold text-gray-800">
                                                            {(item.quantity * item.unitPrice).toFixed(2)}
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 transition duration-300" aria-label="Remove item">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m1-3h6" /></svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <button onClick={handleAddItem} className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300 flex items-center text-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                            Add Item
                                        </button>
                                        <div className="flex justify-end mt-10">
                                            <div className="w-full md:w-1/2 space-y-4">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="font-semibold text-gray-700">Subtotal:</span>
                                                    <span className="text-gray-800 font-bold">{invoice.currency} {subtotal.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="font-semibold text-gray-700">Tax (%):</span>
                                                    <div className="flex items-center">
                                                        <input type="number" name="taxRate" value={invoice.taxRate} onChange={handleInvoiceChange} className="w-20 bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm text-right focus:ring-blue-500 focus:border-blue-500" min="0" />
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center text-lg font-extrabold text-blue-800 border-t-2 border-blue-200 pt-4">
                                                    <span>Total:</span>
                                                    <span>{invoice.currency} {total.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeView === 'saved' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                                        <h2 className="text-2xl font-bold mb-4 text-gray-800">My Saved Invoices</h2>
                                        {savedInvoices.length > 0 ? (
                                            <ul className="space-y-2">
                                                {savedInvoices.map((saved) => (
                                                    <li key={saved.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition duration-200 cursor-pointer" onClick={() => viewInvoiceDetails(saved)}>
                            <span className="text-sm font-medium text-gray-700">
                              Invoice #<span className="font-semibold">{saved.invoiceNumber || 'N/A'}</span>
                              <span className="ml-4 text-xs text-gray-500">({saved.invoiceDate})</span>
                            </span>
                                                        <button onClick={(e) => { e.stopPropagation(); deleteInvoice(saved.id); }} className="text-red-500 hover:text-red-700 transition duration-300 font-semibold text-sm">Delete</button>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-gray-500 text-center">No invoices saved yet. Your saved invoices will appear here.</p>
                                        )}
                                    </div>
                                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                                        <h2 className="text-2xl font-bold mb-4 text-gray-800">Invoice Details</h2>
                                        {selectedInvoice ? (
                                            <ReadOnlyInvoice invoice={selectedInvoice} onEdit={loadInvoice} onDelete={deleteInvoice} />
                                        ) : (
                                            <p className="text-gray-500 text-center">Select an invoice from the list to view its details.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                            {activeView === 'settings' && (
                                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
                                    <h2 className="text-2xl font-bold mb-4 text-gray-800">User Settings</h2>
                                    <form onSubmit={saveSettings}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                                                <input type="text" name="name" value={invoice.sender.name} onChange={(e) => handleAddressChange(e, 'sender')} className="w-full mt-1 bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" placeholder="Your Company Name" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Address</label>
                                                <input type="text" name="address" value={invoice.sender.address} onChange={(e) => handleAddressChange(e, 'sender')} className="w-full mt-1 bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" placeholder="Street Address" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">City</label>
                                                <input type="text" name="city" value={invoice.sender.city} onChange={(e) => handleAddressChange(e, 'sender')} className="w-full mt-1 bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" placeholder="City" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                                                <input type="text" name="postalCode" value={invoice.sender.postalCode} onChange={(e) => handleAddressChange(e, 'sender')} className="w-full mt-1 bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" placeholder="Postal Code" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Country</label>
                                                <input type="text" name="country" value={invoice.sender.country} onChange={(e) => handleAddressChange(e, 'sender')} className="w-full mt-1 bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" placeholder="Country" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Logo URL</label>
                                                <input type="text" name="logoUrl" value={invoice.logoUrl} onChange={handleInvoiceChange} className="w-full mt-1 bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm" placeholder="Paste your logo URL here" />
                                            </div>
                                        </div>
                                        <div className="mt-6 text-right">
                                            <button type="submit" className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-purple-700 transition duration-300">
                                                Save Settings
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    // --- Main App Component Return ---
    return (
        <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
            {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage('')} />}
            {renderView()}
        </div>
    );
};
export default App;
