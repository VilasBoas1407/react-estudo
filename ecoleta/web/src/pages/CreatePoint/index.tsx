import React, { useEffect,useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import api from '../../services/api';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet'


// parei em 01:54
import './styles.css';

import logo from '../../assets/logo.svg';

interface Item{
    id: number,
    title: string,
    image_url: string
}

interface IBGEUFResponse {
    sigla: string;
}

interface IBGECityResponse{
    nome: string;
}
const CreatePoint = () => {

    const [items,setItems] = useState<Array<Item>>([]);
    const [ufs, setUfs] = useState<string[]>([]);
    const [citys, setCitys] = useState<string[]>([]);

    const [initialPosition, setInitialPostion] = useState<[number, number]>([0,0]);

    const [formData, setFormData] = useState({
        name : '',
        email : '',
        whatsapp :''
    });

    const [selectedUf,setSelectedUf] = useState('0');
    const [selectedCity,setSelectedCity] = useState('0');
    const [selectedPosition, setSelectPosition] = useState<[number, number]>([0,0]);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);

    const history = useHistory();

    useEffect(() =>{
        navigator.geolocation.getCurrentPosition(position =>{
            const { latitude, longitude } = position.coords;

            setInitialPostion([latitude,longitude]);
        })
    },[])

    useEffect(() => {
        api.get('items').then(response =>{
            setItems(response.data);
        });
    }, []);
    
    useEffect(() => {
        axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response =>{
            const ufInitials = response.data.map(uf => uf.sigla);
            setUfs(ufInitials);
        });
    }, []);

    useEffect(() => {
    if(selectedUf === '0')
        return;

    axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`).then(response =>{
            const cityNames = response.data.map(city => city.nome);
            console.log(cityNames);
            setCitys(cityNames);
    });

    },[selectedUf]);

    function handleSelectedUF(event: ChangeEvent<HTMLSelectElement>){
        const uf = event.target.value;
        setSelectedUf(uf);
    }

    function handleSelectedCity(event: ChangeEvent<HTMLSelectElement>){
        const city = event.target.value;
        setSelectedCity(city);
    }

    function handleMapClick(event: LeafletMouseEvent){
        setSelectPosition([
            event.latlng.lat,
            event.latlng.lng
        ]);

    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>){
        const { name, value } = event.target;
        setFormData({...formData, [name]: value});
    }

    function handleSelectItem(id : number){
        const alreadySelected = selectedItems.findIndex(item => item === id);

        if(alreadySelected  >= 0){
            const filteredItems = selectedItems.filter(item => item !== id);
            setSelectedItems(filteredItems);
        }
        else
            setSelectedItems([...selectedItems, id]);
    }

    async function handleSubmit( event : FormEvent){
        event.preventDefault();

        const { name, email, whatsapp} = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [ latitude, longitude] = selectedPosition;
        const items = selectedItems;

        const data = {
            name,
            email,
            whatsapp,
            uf,
            city,
            latitude,
            longitude,
            items
        };

        await api.post('points', data);

        alert('Ponto de coleta criado!');

        history.push('/');
    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta" />

                <Link to="/">
                    <FiArrowLeft />
                    Voltar para home
                </Link>
            </header>
        
            <form onSubmit={handleSubmit}>
                <h1> Cadastro do ponto de coleta</h1>
                <fieldset>
                    <legend>
                        <h2>
                            Dados
                        </h2>
                    </legend>
                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input
                            type="text"
                            name="name"
                            id="id"
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input
                                type="text"
                                name="whatsapp"
                                id="whatsapp"
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2> Endereço </h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={14} onClick={handleMapClick}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
                        />

                        <Marker position={selectedPosition}/>
                    </Map>
                    <div className="field-group">            
                        <div className="field"> 
                            <label htmlFor="uf">Estado - UF</label>
                            <select onChange={handleSelectedUF}  value={selectedUf} name="uf" id="uf">
                                <option> Selecione uma UF</option>
                                {ufs.map(uf => (
                                <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field"> 
                            <label htmlFor="city">Selecione uma cidade</label>
                            <select 
                                name="city"
                                id="city"
                                value={selectedCity}
                                onChange={handleSelectedCity}
                            >
                                <option> Selecione uma cidade</option>
                                <option> Selecione uma UF</option>
                                {citys.map(citys => (
                                <option key={citys} value={citys}>{citys}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>
                        <h2>Ítens de coleta</h2>
                        <span>Selecione um ou mais ítens abaixo</span>
                    </legend>
                    <ul className="items-grid">
                        {items.map(items =>
                            (
                                <li 
                                    key={items.id} 
                                    onClick={() => handleSelectItem(items.id)}
                                    className={selectedItems.includes(items.id) ? 'selected' : ''}
                                >
                                    <img src={items.image_url} alt={items.title}/>
                                <span>{items.title}</span>
                                </li>
            
                            )
                        )}
                    </ul>
                </fieldset>
                <button type="submit">
                    Cadastrar Ponto de Coleta
                </button>
            </form>
        </div> 
    );
}

export default CreatePoint;