import React, { useState } from 'react';
import {
  Search,
  Star,
  Clock,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Stethoscope,
  MapPin,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Doctor, Appointment, UserProfile } from '../../types';

interface AppointmentBookingViewProps {
  doctors: Doctor[];
  currentUser: UserProfile;
  onBookAppointment: (newAppointment: Appointment) => void;
  onNavigateTab: (tab: any) => void;
}

export const AppointmentBookingView: React.FC<AppointmentBookingViewProps> = ({
  doctors,
  currentUser,
  onBookAppointment,
  onNavigateTab,
}) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor>(doctors[0]);
  const [selectedDay, setSelectedDay] = useState<number>(24);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('10:00 AM');
  const [consultReason, setConsultReason] = useState('Routine checkup & health review');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookedAppointmentInfo, setBookedAppointmentInfo] = useState<Appointment | null>(null);

  const specialties = [
    'All',
    'Cardiology',
    'Neurology',
    'Dermatology',
    'Orthopedics',
    'General Medicine',
    'Pediatrics',
  ];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSpecialty =
      selectedSpecialty === 'All' ||
      doc.specialty.toLowerCase() === selectedSpecialty.toLowerCase();
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.hospital.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpecialty && matchesSearch;
  });

  const handleConfirmBooking = () => {
    const newApt: Appointment = {
      id: `apt_${Date.now()}`,
      patientId: currentUser.id,
      patientName: currentUser.name,
      patientAvatar: currentUser.avatar,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      specialty: selectedDoctor.specialty,
      doctorAvatar: selectedDoctor.avatar,
      date: `Oct ${selectedDay}, 2024`,
      time: selectedTimeSlot,
      status: 'Confirmed',
      type: `${selectedDoctor.specialty} Consultation`,
      duration: '30m',
      notes: consultReason,
      room: selectedDoctor.hospital.split(',')[0],
    };

    onBookAppointment(newApt);
    setBookedAppointmentInfo(newApt);
    setShowSuccessModal(true);

    try {
      confetti({
        particleCount: 80,
        spread: 65,
        origin: { y: 0.6 },
      });
    } catch {
      // safe fallback
    }
  };

  return (
    <div id="appointment-booking-screen" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Search & Filter Section - Matches Figma Image 4 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="doctor-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find doctors by name, specialty, location..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {specialties.map((spec) => (
            <button
              key={spec}
              id={`filter-chip-${spec.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedSpecialty === spec
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid: 3-Col Doctor Cards on Left, Slide-In Booking Panel on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Doctor Cards Grid (2 Cols on desktop) */}
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doc) => {
            const isSelected = selectedDoctor.id === doc.id;
            return (
              <div
                key={doc.id}
                id={`doctor-card-${doc.id}`}
                className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all duration-150 ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-slate-200/80 shadow-2xs hover:shadow-sm hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Doctor Avatar + Details */}
                  <div className="flex items-start gap-3">
                    <img
                      src={doc.avatar}
                      alt={doc.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h3 className="text-xs md:text-sm font-bold text-slate-900 truncate">
                        {doc.name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate font-medium">
                        {doc.specialty}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">Checkup</p>
                    </div>
                  </div>

                  {/* Experience & Star Rating */}
                  <div className="flex items-center justify-between mt-4 text-xs">
                    <span className="text-slate-500 font-medium">
                      {doc.experienceYears} years exp
                    </span>
                    <div className="flex items-center gap-1 font-bold text-slate-800">
                      <span>{doc.rating}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </div>
                  </div>

                  {/* Next Available Pill */}
                  <div className="mt-3 text-[11px] font-semibold text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded-lg">
                    Next Available: {doc.nextAvailable}
                  </div>
                </div>

                {/* Book Now Button */}
                <button
                  id={`btn-book-doc-${doc.id}`}
                  onClick={() => setSelectedDoctor(doc)}
                  className={`mt-4 w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Book Now'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Right Sticky Booking Panel - Matches Figma Image 4 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs h-fit sticky top-20">
          <h2 className="text-sm md:text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            Book Appointment
          </h2>

          {/* Selected Doctor Badge */}
          <div className="my-4 p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-3">
            <img
              src={selectedDoctor.avatar}
              alt={selectedDoctor.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 truncate">
                {selectedDoctor.name}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {selectedDoctor.specialty} • ${selectedDoctor.consultationFee} Consult
              </div>
            </div>
          </div>

          {/* Calendar Date Picker - Month Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">October 2024</span>
              <div className="flex items-center gap-1 text-slate-400">
                <button className="p-1 hover:text-slate-700 rounded transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-1 hover:text-slate-700 rounded transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Days Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
              {[22, 23, 24, 25, 26, 27, 28].map((day) => {
                const isSelectedDay = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${
                      isSelectedDay
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slot Grid */}
          <div className="mt-5 space-y-3">
            {/* Morning Slots */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Morning
              </div>
              <div className="grid grid-cols-3 gap-2">
                {selectedDoctor.slots.morning.map((slot) => {
                  const isActive = selectedTimeSlot === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isActive
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Afternoon Slots */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Afternoon
              </div>
              <div className="grid grid-cols-3 gap-2">
                {selectedDoctor.slots.afternoon.map((slot) => {
                  const isActive = selectedTimeSlot === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isActive
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reason / Symptoms notes */}
          <div className="mt-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Visit Purpose
            </label>
            <input
              type="text"
              value={consultReason}
              onChange={(e) => setConsultReason(e.target.value)}
              placeholder="e.g., Blood pressure check, skin rash..."
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Confirm Booking CTA */}
          <button
            id="btn-confirm-booking"
            onClick={handleConfirmBooking}
            className="mt-5 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs md:text-sm rounded-xl shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
          >
            Confirm Booking
          </button>
        </div>
      </div>

      {/* Booking Success Modal */}
      {showSuccessModal && bookedAppointmentInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center relative">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Appointment Confirmed!</h3>
            <p className="text-xs text-slate-500 mt-1">
              Your appointment with <strong>{bookedAppointmentInfo.doctorName}</strong> has been
              successfully scheduled.
            </p>

            <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Doctor:</span>
                <span className="font-semibold text-slate-900">
                  {bookedAppointmentInfo.doctorName} ({bookedAppointmentInfo.specialty})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date & Time:</span>
                <span className="font-semibold text-slate-900">
                  {bookedAppointmentInfo.date} at {bookedAppointmentInfo.time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Patient:</span>
                <span className="font-semibold text-slate-900">
                  {bookedAppointmentInfo.patientName}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  onNavigateTab('dashboard');
                }}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
