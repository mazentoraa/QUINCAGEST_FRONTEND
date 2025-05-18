import React, { useState, useContext } from 'react';
import { OrderContext } from '../../contexts/OrderContext';
import './ClientForm.css';

function ClientForm({ onSubmit }) {
  const { addClient } = useContext(OrderContext);
  const [client, setClient] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClient({ ...client, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newClient = addClient(client);
    onSubmit(newClient);
  };

  return (
    <form onSubmit={handleSubmit} className="client-form">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName">Prénom</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={client.firstName}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="lastName">Nom</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={client.lastName}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={client.email}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="phone">Téléphone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={client.phone}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="address">Adresse</label>
        <textarea
          id="address"
          name="address"
          value={client.address}
          onChange={handleChange}
          required
        ></textarea>
      </div>
      
      <button type="submit" className="submit-btn">Ajouter le client</button>
    </form>
  );
}

export default ClientForm;