'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

// Helper Component for Password Input with Toggle
function PasswordInput({ value, onChange, name, placeholder = '' }: { value: string, onChange: (e: any) => void, name: string, placeholder?: string }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                type={show ? "text" : "password"}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition pr-10"
            />
            <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
                {show ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                )}
            </button>
        </div>
    );
}

export default function SettingsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        googleApiKey: '',
        googleCx: '',
        azureSpeechKey: '',
        azureSpeechRegion: '',
        geminiApiKey: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                googleApiKey: user.googleApiKey || '',
                googleCx: user.googleCx || '',
                azureSpeechKey: user.azureSpeechKey || '',
                azureSpeechRegion: user.azureSpeechRegion || '',
                geminiApiKey: user.geminiApiKey || '',
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess('');
        setError('');

        try {
            if (!user) return;
            await api.patch(`/users/${user.id}`, formData);
            setSuccess('Cập nhật thành công!');
            // TODO: Could trigger a re-fetch of user here to update context, but ignoring for now
        } catch (err) {
            setError('Có lỗi xảy ra khi cập nhật.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return <div className="p-8 text-center text-white">Loading...</div>;
    if (!user) return <div className="p-8 text-center text-white">Vui lòng đăng nhập để xem cài đặt.</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-6 justify-center flex items-center">
            <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
                <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Cài đặt tài khoản
                </h1>

                {success && <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded text-green-200">{success}</div>}
                {error && <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded text-red-200">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-purple-300 border-b border-white/10 pb-2">Thông tin cá nhân</h2>
                        <div className="grid gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                                <input
                                    type="text"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-gray-400 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Tên hiển thị</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-purple-300 border-b border-white/10 pb-2">Cấu hình Extension</h2>
                        <p className="text-sm text-gray-400 mb-4">Các thông tin này sẽ được Extension tự động đồng bộ.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center justify-between">
                                    Google API Key
                                    {formData.googleApiKey ? <span className="text-xs text-green-400 font-semibold bg-green-900/30 px-2 py-0.5 rounded">✅ Đã nhập</span> : <span className="text-xs text-gray-500">⚪ Không bắt buộc</span>}
                                </label>
                                <PasswordInput
                                    name="googleApiKey"
                                    value={formData.googleApiKey}
                                    onChange={handleChange}
                                    placeholder="AIza..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center justify-between">
                                    Google Cx (Search Engine ID)
                                    {formData.googleCx ? <span className="text-xs text-green-400 font-semibold bg-green-900/30 px-2 py-0.5 rounded">✅ Đã nhập</span> : <span className="text-xs text-gray-500">⚪ Không bắt buộc</span>}
                                </label>
                                <input
                                    type="text"
                                    name="googleCx"
                                    value={formData.googleCx}
                                    onChange={handleChange}
                                    placeholder="012345..."
                                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center justify-between">
                                        Azure Speech Key
                                        {formData.azureSpeechKey ? <span className="text-xs text-green-400 font-semibold bg-green-900/30 px-2 py-0.5 rounded">✅ Đã nhập</span> : <span className="text-xs text-gray-500">⚪ Không bắt buộc</span>}
                                    </label>
                                    <PasswordInput
                                        name="azureSpeechKey"
                                        value={formData.azureSpeechKey}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center justify-between">
                                        Azure Region
                                        {formData.azureSpeechRegion ? <span className="text-xs text-green-400 font-semibold bg-green-900/30 px-2 py-0.5 rounded">✅ Đã nhập</span> : <span className="text-xs text-gray-500">⚪ Không bắt buộc</span>}
                                    </label>
                                    <input
                                        type="text"
                                        name="azureSpeechRegion"
                                        value={formData.azureSpeechRegion}
                                        onChange={handleChange}
                                        placeholder="eastus"
                                        className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center justify-between">
                                    Gemini API Key (AI Analysis)
                                    {formData.geminiApiKey ? <span className="text-xs text-green-400 font-semibold bg-green-900/30 px-2 py-0.5 rounded">✅ Đã cấu hình</span> : <span className="text-xs text-red-300 font-semibold bg-red-900/30 px-2 py-0.5 rounded">❌ Chưa nhập</span>}
                                </label>
                                <PasswordInput
                                    name="geminiApiKey"
                                    value={formData.geminiApiKey}
                                    onChange={handleChange}
                                    placeholder="AIza..."
                                />
                                <p className="text-xs text-gray-500 mt-1">Dùng để phân tích ngữ cảnh và dịch nâng cao.</p>
                            </div>
                        </div>
                    </section>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-white font-semibold shadow-lg transition transform active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Đang lưu...' : 'Lưu cài đặt'}
                    </button>
                </form>
            </div>
        </div>
    );
}
