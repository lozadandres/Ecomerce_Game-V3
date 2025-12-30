import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SmartRecommendations = ({ cartItems }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRecommendations = async () => {
            setLoading(true);
            try {
                const response = await axios.post('http://localhost:5000/api/recommendations', {
                    cartItems: cartItems
                });
                setRecommendations(response.data);
            } catch (error) {
                console.error("Error fetching recommendations:", error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchRecommendations();
        }, 500);
        return () => clearTimeout(timer);
    }, [cartItems]);

    const getCoverImage = (product) => {
        if (product.imagenes && product.imagenes.length > 0) {
            const principalImage = product.imagenes.find(img => img.esPrincipal);
            return principalImage ? principalImage.url : product.imagenes[0].url;
        }
        return product.image || null;
    };

    if (loading) {
        return (
            <div className="recommendations-section-modern">
                <h4 style={{ color: 'white', marginBottom: '1.5rem' }}>Buscando las mejores recomendaciones...</h4>
                <div className="recommendations-grid-modern">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="cart-item-premium" style={{ height: '300px', opacity: 0.5, animation: 'pulse 1.5s infinite' }}></div>
                    ))}
                </div>
            </div>
        );
    }

    if (recommendations.length === 0) return null;

    return (
        <div className="recommendations-section-modern">
            <h4 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 800 }}>Productos recomendados</h4>
            
            <div className="recommendations-grid-modern">
                {recommendations.slice(0, 3).map((product) => {
                    const coverImage = getCoverImage(product);
                    const oldPrice = product.price * 1.25; // Simulado para el diseño

                    return (
                        <div
                            key={product.id}
                            className="product-card"
                            style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', height: 'auto' }}
                            onClick={() => navigate(`/product/${product.id}`)}
                        >
                            <div style={{ position: 'relative', borderRadius: '15px', overflow: 'hidden', aspectRatio: '16/9', marginBottom: '1rem' }}>
                                <img
                                    src={coverImage ? `http://localhost:5000${coverImage}` : 'https://via.placeholder.com/150'}
                                    alt={product.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                                />
                                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '5px', color: '#ff4500', fontSize: '0.7rem', fontWeight: 700 }}>
                                    -25%
                                </div>
                            </div>

                            <h5 style={{ color: 'white', margin: '0 0 0.5rem 0', fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</h5>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                <div>
                                    <span style={{ color: '#ff4500', fontWeight: 900, fontSize: '1.2rem' }}>${product.price.toFixed(2)}</span>
                                    <span style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through', fontSize: '0.8rem', marginLeft: '8px' }}>${oldPrice.toFixed(2)}</span>
                                </div>
                                <button
                                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/product/${product.id}`);
                                    }}
                                >
                                    Añadir
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SmartRecommendations;
