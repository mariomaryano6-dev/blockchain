import React, { useState } from 'react';
import { ethers } from 'ethers';
import './App.css';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contractInfo';

function roleLabel(role) {
    if (role === 'MANUFACTURER') return 'Fabricant';
    if (role === 'SUPPLIER') return 'Fournisseur';
    if (role === 'RETAILER') return 'Vendeur';
    return 'Client / Non autorisé';
}

function App() {
    const [walletAddress, setWalletAddress] = useState('');
    const [role, setRole] = useState('NONE');
    const [productName, setProductName] = useState('');
    const [file, setFile] = useState(null);
    const [lastProduct, setLastProduct] = useState(null);
    const [loading, setLoading] = useState(false);

    async function requestAccount() {
        if (!window.ethereum) {
            alert('Installez MetaMask !');
            return;
        }

        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });
            const addr = accounts[0];
            setWalletAddress(addr);

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            const r = await contract.getMyRole();
            const n = Number(r);
            if (n === 1) setRole('MANUFACTURER');
            else if (n === 2) setRole('SUPPLIER');
            else if (n === 3) setRole('RETAILER');
            else setRole('NONE');
        } catch (error) {
            console.error('Erreur de connexion :', error);
        }
    }

    const uploadToIPFS = async () => {
        if (!file) return null;
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: {
                    Authorization:
                        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0MGNiNzA5Ni03NjYyLTQwZjktYmRlYi1jZWM3MzlhZTdjOTMiLCJlbWFpbCI6Im1hcmlvbWFyeWFubzZAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjNiOWJhYjQ4ZGZlMjAxODJkZWEyIiwic2NvcGVkS2V5U2VjcmV0IjoiZDI0NzdjYzM1YWIyMmU2YzJhMjQwNjFmZTY2OTI0NDZiNTRhYWEyOWIwMjQyYzEwMGY1YWNmMzFkMGRmOTk2MCIsImV4cCI6MTgwMDIwMjExM30.v6FJVwcemrzRJQ8e_Yxo_QavKKwNtsTcPwNvUa-QKqk',
                },
                body: formData,
            });

            const data = await res.json();
            return data.IpfsHash || null;
        } catch (error) {
            console.error('Erreur IPFS :', error);
            return null;
        }
    };

    async function registerOnBlockchain() {
        if (role !== 'MANUFACTURER') {
            alert('Seul le Fabricant peut enregistrer des produits.');
            return;
        }

        if (!productName || !file) {
            alert('Remplissez le nom et choisissez une image.');
            return;
        }

        const imageHash = await uploadToIPFS();
        if (!imageHash) {
            alert("Erreur lors de l’upload IPFS.");
            return;
        }

        try {
            setLoading(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            const tx = await contract.registerProduct(productName, imageHash);
            await tx.wait();
            alert('Produit enregistré sur la blockchain !');
            await fetchLastProduct();
        } catch (err) {
            console.error('Erreur transaction :', err);
        } finally {
            setLoading(false);
        }
    }

    async function fetchLastProduct() {
        if (!window.ethereum) return;
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

            const count = await contract.productCount();
            if (count > 0n) {
                const product = await contract.products(count);
                setLastProduct({
                    id: product.id.toString(),
                    name: product.name,
                    ipfsHash: product.ipfsHash,
                });
            }
        } catch (err) {
            console.error('Erreur de lecture :', err);
        }
    }

    return (
        <div className="App">
            <header className="App-header">
                <h1>Anti-Contrefaçon</h1>

                {!walletAddress ? (
                    <button onClick={requestAccount} className="connect-btn">
                        Connecter MetaMask
                    </button>
                ) : (
                    <div className="container">
                        <p>Wallet : {walletAddress.substring(0, 10)}...</p>
                        <p>Rôle détecté : {roleLabel(role)}</p>

                        {role === 'MANUFACTURER' && (
                            <div className="form-box">
                                <input
                                    type="text"
                                    placeholder="Nom du produit"
                                    onChange={(e) => setProductName(e.target.value)}
                                />
                                <input
                                    type="file"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                                <button
                                    className="submit-btn"
                                    onClick={registerOnBlockchain}
                                    disabled={loading}
                                >
                                    {loading ? 'Enregistrement...' : 'Enregistrer le produit'}
                                </button>
                            </div>
                        )}

                        {role !== 'MANUFACTURER' && (
                            <p style={{ marginTop: '10px', color: 'orange' }}>
                                Vous êtes connecté en tant que {roleLabel(role)} : l’enregistrement
                                de produits est réservé au Fabricant.
                            </p>
                        )}

                        <button style={{ marginTop: '20px' }} onClick={fetchLastProduct}>
                            Voir le dernier produit
                        </button>

                        {lastProduct && (
                            <div
                                className="product-display"
                                style={{
                                    marginTop: '20px',
                                    border: '1px solid #61dafb',
                                    padding: '15px',
                                }}
                            >
                                <h3>Dernier produit enregistré</h3>
                                <img
                                    src={`https://gateway.pinata.cloud/ipfs/${lastProduct.ipfsHash}`}
                                    alt="Product"
                                    style={{ width: '150px' }}
                                />
                                <p>
                                    <strong>Nom :</strong> {lastProduct.name} | <strong>ID :</strong> #
                                    {lastProduct.id}
                                </p>
                                <p style={{ color: 'green' }}>✅ Authentifié sur Blockchain</p>
                            </div>
                        )}
                    </div>
                )}
            </header>
        </div>
    );
}

export default App;
