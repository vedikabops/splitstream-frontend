function RoomTypeModal({ isOpen, onClose, onSelectType }) {
    if (!isOpen) return null;

    return (
        <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div onClick={(e) => e.stopPropagation()} className="bg-[#3c3836] relative p-8 rounded-2xl border-2 border-[#504945] shadow-xl max-w-2xl w-full">
                <h2 className="text-2xl font-bold text-[#ebdbb2] mb-4">Choose Room Type</h2>
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="bg-[#504945] p-6 rounded-lg hover:border-[#b8bb26] border-2 border-transparent transition-all">
                        <h3 className="text-lg font-bold text-[#ebdbb2] mb-2">Collaborative</h3>
                        <p className="text-sm text-[#ebdbb2]">Watch videos together with a shared playlist.</p>
                        <button className="bg-[#b8bb26] hover:bg-[#9da01e] text-[#282828] transition-colors w-full py-3 px-6 rounded-lg mt-4" onClick={() => onSelectType('collaborative')}>Create Collaborative Room</button>
                    </div>
                    <div className="bg-[#504945] p-6 rounded-lg hover:border-[#fe8019] border-2 border-transparent transition-all">
                        <h3 className="text-lg font-bold text-[#ebdbb2] mb-2">Presentation</h3>
                        <p className="text-sm text-[#ebdbb2]">Play videos for other people in the room.</p>
                        <button className="bg-[#fe8019] hover:bg-[#d65d0e] text-[#282828] transition-colors w-full py-3 px-6 rounded-lg mt-4" onClick={() => onSelectType('presentation')}>Create Presentation Room</button>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 hover:text-[#ebdbb2] text-[#928374] transition-colors text-2xl"
                >
                    ×
                </button>
            </div>
        </div>
    );
}

export default RoomTypeModal;