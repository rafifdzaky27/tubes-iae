'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useServiceClient } from '@/lib/apollo-provider';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// GraphQL Queries and Mutations
const GET_RESERVATIONS = gql`
  query GetReservations {
    reservations {
      id
      guestId
      roomId
      checkInDate
      checkOutDate
      status
      guest {
        id
        fullName
        email
      }
      room {
        id
        roomNumber
        roomType
        pricePerNight
      }
    }
  }
`;

const CREATE_RESERVATION = gql`
  mutation CreateReservation($reservationData: ReservationInput!) {
    createReservation(reservationData: $reservationData) {
      id
      guestId
      roomId
      checkInDate
      checkOutDate
      status
    }
  }
`;

const UPDATE_RESERVATION = gql`
  mutation UpdateReservation($id: Int!, $reservationData: ReservationUpdateInput!) {
    updateReservation(id: $id, reservationData: $reservationData) {
      id
      guestId
      roomId
      checkInDate
      checkOutDate
      status
    }
  }
`;

const DELETE_RESERVATION = gql`
  mutation DeleteReservation($id: Int!) {
    deleteReservation(id: $id)
  }
`;

const GET_GUESTS_FOR_SELECT = gql`
  query GetGuestsForSelect {
    guests {
      id
      fullName
    }
  }
`;

const GET_AVAILABLE_ROOMS_FOR_SELECT = gql`
  query GetAvailableRoomsForSelect {
    availableRooms {
      id
      roomNumber
      roomType
      pricePerNight
      status
    }
  }
`;

// Type Definitions
type Guest = {
  id: number;
  fullName: string;
  email?: string; // Optional as not always needed for display
};

type Room = {
  id: number;
  roomNumber: string;
  roomType: string;
  pricePerNight: number;
};

type Reservation = {
  id: number;
  guestId: number;
  roomId: number;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  totalAmount: number;
  guest?: Guest; // Nested guest info
  room?: Room;   // Nested room info
};

type ReservationFormData = {
  id?: number;
  guestId: string | null;
  roomId: string | null;
  checkInDate: Date | null;
  checkOutDate: Date | null;
  status: string;
};

// Helper to format date to YYYY-MM-DD string
const formatDateString = (date: Date | null): string => {
  if (!date) return '';
  return date.toISOString().split('T')[0];
};

export default function ReservationsPage() {
  // Service clients
  const reservationClient = useServiceClient('reservation');
  const guestClient = useServiceClient('guest');
  const roomClient = useServiceClient('room');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Current reservation for editing/deleting
  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null);
  
  // Search term for filtering reservations
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for form data
  const initialFormState: ReservationFormData = {
    guestId: null,
    roomId: null,
    checkInDate: null,
    checkOutDate: null,
    status: 'confirmed',
  };
  const [formData, setFormData] = useState<ReservationFormData>(initialFormState);
  const [totalAmount, setTotalPrice] = useState<number>(0);

  // Data for select inputs
  const [guestsForSelect, setGuestsForSelect] = useState<Guest[]>([]);
  const [availableRoomsForForm, setAvailableRoomsForForm] = useState<Room[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [guestSearchTerm, setGuestSearchTerm] = useState('');
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);

  // Fetch reservations
  const { 
    loading: reservationsLoading,
    error: reservationsError,
    data: reservationsData,
    refetch: refetchReservations 
  } = useQuery(GET_RESERVATIONS, { client: reservationClient });

  // Fetch guests for select dropdown
  const { 
    loading: guestsLoading,
    error: guestsError,
    data: guestsSelectData 
  } = useQuery<{ guests: Guest[] }>(GET_GUESTS_FOR_SELECT, {
    client: guestClient,
    onCompleted: (data: { guests: Guest[] }) => {
      setGuestsForSelect(data.guests || []);
    }
  });

  // Fetch available rooms for select dropdown (conditionally)
  const { 
    loading: availableRoomsLoading,
    error: availableRoomsError,
    refetch: refetchAvailableRooms,
    data: availableRoomsData
  } = useQuery<{ availableRooms: Room[] }>(GET_AVAILABLE_ROOMS_FOR_SELECT, {
    client: roomClient,
    onCompleted: (data: { availableRooms: Room[] }) => {
      console.log('Available rooms data received:', data);
      if (data?.availableRooms) {
        console.log('Setting available rooms:', data.availableRooms);
        setAvailableRoomsForForm(data.availableRooms || []);
      } else {
        console.log('No available rooms data found');
        setAvailableRoomsForForm([]);
      }
      // If the previously selected room is no longer available, reset it
      if (selectedRoom && data?.availableRooms && !data.availableRooms.find((r: Room) => r.id === selectedRoom.id)) {
        setSelectedRoom(null);
        setFormData((prev: ReservationFormData) => ({ ...prev, roomId: null }));
      }
    },
    onError: (error: any) => {
      console.error('Error fetching available rooms:', error);
      toast.error(`Error fetching available rooms: ${error.message}`);
      setAvailableRoomsForForm([]);
    }
  });

  // Mutations
  const [createReservation, { loading: createLoading }] = useMutation<any, { reservationData: any }>(CREATE_RESERVATION, {
    client: reservationClient,
    onCompleted: () => {
      toast.success('Reservation created successfully');
      refetchReservations();
      closeModal();
    },
    onError: (error: any) => toast.error(`Error creating reservation: ${error.message}`),
  });

  const [updateReservation, { loading: updateLoading }] = useMutation<any, { id: number, reservationData: any }>(UPDATE_RESERVATION, {
    client: reservationClient,
    onCompleted: () => {
      toast.success('Reservation updated successfully');
      refetchReservations();
      closeModal();
    },
    onError: (error: any) => toast.error(`Error updating reservation: ${error.message}`),
  });

  const [deleteReservation, { loading: deleteLoading }] = useMutation<any, { id: number }>(DELETE_RESERVATION, {
    client: reservationClient,
    onCompleted: () => {
      toast.success('Reservation deleted successfully');
      refetchReservations();
      setIsDeleteModalOpen(false);
      setCurrentReservation(null);
    },
    onError: (error: any) => toast.error(`Error deleting reservation: ${error.message}`),
  });

  // Handle deletion of a reservation
  const handleDelete = async () => {
    if (!currentReservation) return;
    
    try {
      await deleteReservation({
        variables: {
          id: parseInt(currentReservation.id.toString())
        }
      });
    } catch (error) {
      console.error('Error deleting reservation:', error);
    }
  };

  // Fetch available rooms when component mounts
  useEffect(() => {
    console.log('Fetching available rooms...');
    refetchAvailableRooms()
      .then(response => {
        console.log('Available rooms response:', response);
        if (response?.data?.availableRooms) {
          console.log('Setting available rooms from refetch:', response.data.availableRooms);
          setAvailableRoomsForForm(response.data.availableRooms);
        } else {
          console.log('No available rooms data in refetch response');
        }
      })
      .catch(error => {
        console.error('Error fetching available rooms:', error);
      });
  }, [refetchAvailableRooms]);
  
  // Debug log for availableRoomsForForm
  useEffect(() => {
    console.log('availableRoomsForForm updated:', availableRoomsForForm);
  }, [availableRoomsForForm]);
  
  // Filter rooms based on dates
  useEffect(() => {
    if (formData.checkInDate && formData.checkOutDate && availableRoomsForForm.length > 0) {
      // Filter rooms based on dates if needed
      // For now, we're using all available rooms
    }
  }, [formData.checkInDate, formData.checkOutDate, availableRoomsForForm]);

  // Calculate total price
  const calculateTotalPrice = (pricePerNight: number, checkInDate: Date | null, checkOutDate: Date | null) => {
    if (!checkInDate || !checkOutDate) return;
    
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    setTotalPrice(pricePerNight * diffDays);
  };

  useEffect(() => {
    if (selectedRoom?.pricePerNight && formData.checkInDate && formData.checkOutDate) {
      calculateTotalPrice(selectedRoom.pricePerNight, formData.checkInDate, formData.checkOutDate);
    } else {
      setTotalPrice(0);
    }
  }, [formData.checkInDate, formData.checkOutDate, selectedRoom]);

  // Reset form and selections
  const resetForm = () => {
    setFormData(initialFormState);
    setSelectedGuest(null);
    setSelectedRoom(null);
    setAvailableRoomsForForm([]);
    setTotalPrice(0);
  };

  // Modal handlers
  const openCreateModal = () => {
    setCurrentReservation(null);
    resetForm();
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (reservation: Reservation) => {
    setCurrentReservation(reservation);
    setIsEditing(true);
    
    // Find the guest and room objects
    const guest = guestsForSelect.find(g => g.id === reservation.guestId);
    const room = availableRoomsForForm.find(r => r.id === reservation.roomId);
    
    if (guest) {
      setSelectedGuest(guest);
      setGuestSearchTerm(guest.fullName);
    }
    
    if (room) {
      setSelectedRoom(room);
      setRoomSearchTerm(room.roomNumber);
    }
    
    // Convert string dates to Date objects for the form
    const checkInDate = reservation.checkInDate ? new Date(reservation.checkInDate) : null;
    const checkOutDate = reservation.checkOutDate ? new Date(reservation.checkOutDate) : null;
    
    setFormData({
      id: reservation.id,
      guestId: reservation.guest?.id.toString() || '',
      roomId: reservation.room?.id.toString() || '',
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      status: reservation.status,
    });
    
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentReservation(null);
    resetForm();
  };

  const openDeleteModal = (reservation: Reservation) => {
    setCurrentReservation(reservation);
    setIsDeleteModalOpen(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Different validation for editing vs creating
    if (isEditing) {
      // When editing, we only require status to be set if we're just updating status
      if (!formData.status) {
        toast.error('Please select a status');
        return;
      }
    } else {
      // For new reservations, validate all required fields
      if (!formData.guestId || !formData.roomId || !formData.checkInDate || !formData.checkOutDate) {
        toast.error('Please fill in all required fields');
        return;
      }
    }

    try {
      if (isEditing && formData.id) {
        // For editing, only include fields that should be updated
        const updateData: any = {
          status: formData.status
        };
        
        // Only include these fields if they've been changed
        if (formData.checkInDate) updateData.checkInDate = formatDateString(formData.checkInDate);
        if (formData.checkOutDate) updateData.checkOutDate = formatDateString(formData.checkOutDate);
        
        // Always keep the original roomId and guestId when editing
        if (currentReservation) {
          updateData.roomId = currentReservation.room?.id || parseInt(formData.roomId);
          updateData.guestId = currentReservation.guest?.id || parseInt(formData.guestId);
        }
        
        // Update existing reservation
        await updateReservation({
          variables: {
            id: formData.id,
            reservationData: updateData
          }
        });
        toast.success('Reservation updated successfully');
      } else {
        // Create new reservation
        await createReservation({
          variables: {
            reservationData: reservationData
          }
        });
        toast.success('Reservation created successfully');
      }

      // Reset form and close modal
      setFormData(initialFormState);
      setIsModalOpen(false);
      setIsEditing(false);
      setSelectedGuest(null);
      setSelectedRoom(null);
      refetchReservations();
    } catch (error) {
      console.error('Error submitting reservation:', error);
      toast.error('Error saving reservation');
    }
  };

  // Filter reservations based on search input
  const filteredReservations = reservationsData?.reservations.filter((reservation: Reservation) => {
    const guestName = reservation.guest?.fullName.toLowerCase() || '';
    const roomNumber = reservation.room?.roomNumber.toLowerCase() || '';
    const status = reservation.status.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return guestName.includes(searchLower) || 
           roomNumber.includes(searchLower) || 
           status.includes(searchLower);
  }) || [];

  // Filter guests based on search input
  const filteredGuests = guestsSelectData?.guests.filter((guest: Guest) => {
    return guest.fullName.toLowerCase().includes(guestSearchTerm.toLowerCase());
  }) || [];

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'badge-success';
      case 'checked_in':
        return 'badge-primary';
      case 'checked_out':
        return 'badge-info';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  // Helper function to calculate total price for display
  const calculateTotalPriceForDisplay = (checkInDate: string, checkOutDate: string, pricePerNight: number) => {
    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * pricePerNight;
  };

  // Date formatting for display
  const displayFormatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };
  
  // Format date for API
  const formatDateForAPI = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };
  
  // Render loading/error states for dropdowns
  const renderGuestSelectLoadingError = () => {
    if (guestsLoading) return <p className="text-xs text-gray-500 p-2">Loading guests...</p>;
    if (guestsError) return <p className="text-xs text-red-500 p-2">Error loading guests.</p>;
    if (guestsSelectData?.guests.length === 0) return <p className="text-xs text-gray-500 p-2">No guests found.</p>;
    return null;
  };

  const renderRoomSelectLoadingError = () => {
    if (!formData.checkInDate || !formData.checkOutDate) return <p className="text-xs text-gray-500 p-2">Select check-in and check-out dates first.</p>;
    if (availableRoomsLoading) return <p className="text-xs text-gray-500 p-2">Loading available rooms...</p>;
    if (availableRoomsError) return <p className="text-xs text-red-500 p-2">Error loading rooms.</p>;
    if (availableRoomsForForm.length === 0 && formData.checkInDate && formData.checkOutDate) return <p className="text-xs text-gray-500 p-2">No rooms available for selected dates.</p>;
    return null;
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDateChange = (field: 'checkInDate' | 'checkOutDate', date: Date | null) => {
    setFormData({
      ...formData,
      [field]: date,
    });
  };

  const handleGuestSelect = (guest: Guest) => {
    setSelectedGuest(guest);
    setFormData({
      ...formData,
      guestId: guest.id.toString(),
    });
  };

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    setFormData({
      ...formData,
      roomId: room.id.toString(),
    });
  };

  const setSelectedGuestAndFormId = (guest: Guest) => {
    setSelectedGuest(guest);
    setFormData({
      ...formData,
      guestId: guest.id.toString(),
    });
  };

  const setSelectedRoomAndFormId = (room: Room) => {
    setSelectedRoom(room);
    setFormData({
      ...formData,
      roomId: room.id.toString(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reservation Management</h1>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          Add Reservation
        </button>
      </div>

      {/* Search and filters */}
      <div className="flex items-center bg-white rounded-lg shadow-sm p-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search reservations by guest, room, status or dates..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Reservations table */}
      <div className="table-container">
        {reservationsLoading ? (
          <div className="text-center py-10">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-500">Loading reservations...</p>
          </div>
        ) : reservationsError ? (
          <div className="text-center py-10">
            <p className="text-red-500">Error loading reservations: {reservationsError.message}</p>
          </div>
        ) : (
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Guest</th>
                <th className="table-header-cell">Room</th>
                <th className="table-header-cell">Dates</th>
                <th className="table-header-cell">Total Price</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    No reservations found. {searchTerm ? 'Try a different search term.' : 'Add a reservation to get started.'}
                  </td>
                </tr>
              ) : (
                filteredReservations.map((reservation: Reservation) => (
                  <tr key={reservation.id} className="table-row">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reservation.guest?.fullName || 'Unknown Guest'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reservation.room?.roomNumber} ({reservation.room?.roomType})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {displayFormatDate(reservation.checkInDate)} - {displayFormatDate(reservation.checkOutDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${reservation.room?.pricePerNight ? calculateTotalPriceForDisplay(reservation.checkInDate, reservation.checkOutDate, reservation.room.pricePerNight).toFixed(2) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={getStatusBadge(reservation.status)}>
                        {reservation.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(reservation)}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(reservation)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Reservation Modal */}
      {isModalOpen && (
        <Dialog open={isModalOpen} onClose={closeModal} className="relative z-50">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                {currentReservation ? 'Edit Reservation' : 'Create New Reservation'}
              </Dialog.Title>
              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                {/* Guest Selection */}
                <div>
                  <label htmlFor="guest" className="block text-sm font-medium text-gray-700">
                    Guest
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search guests..."
                      value={guestSearchTerm}
                      onChange={(e) => setGuestSearchTerm(e.target.value)}
                      onClick={() => setShowGuestDropdown(true)}
                      className="w-full p-2 border rounded"
                    />
                    {showGuestDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-auto">
                        {filteredGuests.length > 0 ? (
                          filteredGuests.map((guest) => (
                            <div
                              key={guest.id}
                              className="p-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                handleGuestSelect(guest);
                                setShowGuestDropdown(false);
                                setGuestSearchTerm(guest.fullName);
                              }}
                            >
                              {guest.fullName}
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-gray-500">No guests found</div>
                        )}
                      </div>
                    )}
                  </div>
                  {formData.guestId === null && <p className="text-xs text-red-500 mt-1">Guest is required.</p>}
                </div>

                {/* Check-in and Check-out Dates */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="checkInDate" className="block text-sm font-medium text-gray-700">
                      Check-in Date
                    </label>
                    <DatePicker
                      selected={formData.checkInDate}
                      onChange={(date) => handleDateChange('checkInDate', date)}
                      dateFormat="yyyy-MM-dd"
                      className="w-full p-2 border rounded"
                      placeholderText="Select check-in date"
                      minDate={new Date()}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="checkOutDate" className="block text-sm font-medium text-gray-700">
                      Check-out Date
                    </label>
                    <DatePicker
                      selected={formData.checkOutDate}
                      onChange={(date) => handleDateChange('checkOutDate', date)}
                      dateFormat="yyyy-MM-dd"
                      className="w-full p-2 border rounded"
                      placeholderText="Select check-out date"
                      minDate={formData.checkInDate ? new Date(formData.checkInDate.getTime() + 86400000) : new Date()}
                      required
                    />
                  </div>
                </div>

                {/* Room Selection */}
                <div className="mb-4">
                  <label htmlFor="room" className="block text-sm font-medium text-gray-700">
                    Room
                  </label>
                  {isEditing && currentReservation ? (
                    <div>
                      <input 
                        type="text" 
                        className="w-full p-2 border rounded bg-gray-100" 
                        value={`${currentReservation.room?.roomNumber || 'Unknown'} (${currentReservation.room?.roomType || 'Unknown'})`}
                        readOnly 
                      />
                      <p className="text-xs text-gray-500 mt-1">Room cannot be changed when editing a reservation</p>
                    </div>
                  ) : (
                    <>
                      <select
                        id="room"
                        className="w-full p-2 border rounded"
                        value={selectedRoom ? selectedRoom.id : ''}
                        onChange={(e) => {
                          const roomId = e.target.value;
                          const room = availableRoomsForForm.find(r => r.id.toString() === roomId);
                          if (room) {
                            handleRoomSelect(room);
                          }
                        }}
                        required
                      >
                        <option value="">Select a room</option>
                        {availableRoomsForForm && availableRoomsForForm.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.roomNumber} ({room.roomType}) - ${room.pricePerNight}/night
                          </option>
                        ))}
                      </select>
                      {availableRoomsLoading && <p className="text-sm text-gray-500 mt-1">Loading rooms...</p>}
                      {availableRoomsError && <p className="text-sm text-red-500 mt-1">Error loading rooms</p>}
                      {!availableRoomsLoading && availableRoomsForForm.length === 0 && <p className="text-sm text-gray-500 mt-1">No rooms available</p>}
                      {!isEditing && formData.roomId === null && <p className="text-xs text-red-500 mt-1">Room is required.</p>}
                    </>
                  )}
                </div>

                {/* Status Selection */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    required
                  >
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="CHECKED_IN">Checked-In</option>
                    <option value="CHECKED_OUT">Checked-Out</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {/* Total Price Display */}
                {totalAmount !== null && (
                  <div className="mt-4">
                    <p className="text-lg font-semibold text-gray-700">
                      Total Price: <span className="text-primary-600">${totalAmount.toFixed(2)}</span>
                    </p>
                    <p className="text-xs text-gray-500">Calculated based on room price and duration of stay. Final price determined by backend.</p>
                  </div>
                )}

                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={createLoading || updateLoading || !formData.guestId || !formData.roomId || !formData.checkInDate || !formData.checkOutDate}
                  >
                    {createLoading || updateLoading ? 'Saving...' : (currentReservation ? 'Update Reservation' : 'Create Reservation')}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && currentReservation && (
        <Dialog open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <Dialog.Title className="text-lg font-semibold text-gray-900">Delete Reservation</Dialog.Title>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete the reservation for guest <span className="font-medium">{currentReservation.guest?.fullName}</span> in room <span className="font-medium">{currentReservation.room?.roomNumber}</span>?
                  This action cannot be undone.
                </p>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="btn-secondary"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="btn-danger"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Reservation'}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </div>
  );
}
