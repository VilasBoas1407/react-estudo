import { Request, Response } from 'express';
import knex from '../database/connection';

class PointsController {
    async index(request : Request, response: Response){
        try{
            const { city, uf, items } = request.query;

            const parsedItems = String(items)
            .split(',')
            .map(item => Number(item.trim()));

            const points = await knex('points')
                .join('point_items','points.id','=','point_items.point_id')
                .whereIn('point_items.item_id', parsedItems)
                .where('city',String(city))
                .where('uf',String(uf))
                .distinct()
                .select('points.*');
            if(!points)
                return response.status(200).json({ message: 'Não encontramos pontos com os filtros passados!'});
            
                return response.status(200).json(points);

        }
        catch(err){
            return response.status(405).json({ message: err });
        }
    }

    async show(request : Request, response: Response){
        try{

            const { id } = request.params;

            const point = await knex('points').where('id',id).first();
    
            if(!point){
                return response.status(400).json({ message: 'Ponto não encontrado!'});
            }
    
            const items = await knex('items')
            .join('point_items','items.id','=','point_items.item_id')
            .where('point_items.point_id',id)
            .select('items.titulo');
    
            return response.json({point, items});
        }
        catch(err){
            return response.status(405).json({ message: err });
        }
    }

    async create(request : Request, response : Response){

        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            items    
        } = request.body;

        const trx = await knex.transaction();

        const point = {     
            image: 'image.png', //Adicionar URL de imagem
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        }
    
        const insertedIds = await trx('points').insert(point);

        const point_id = insertedIds[0];

        const pointsItems = items.map((item_id: number) =>{
            return {
                item_id,
                point_id: point_id,
            }
        });

        await trx('point_items').insert(pointsItems);

        await trx.commit();
        
        return response.json({
            id: point_id,
            ...point
        });
    }
}

export default PointsController;