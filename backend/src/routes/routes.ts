import { FastifyInstance } from 'fastify'

// Controllers de Usuário
import { createUser } from './services/user/create-user'
import { getUserById, getUserByCarteira } from './services/user/get-user'

// Controllers de Carteira
import { createCarteira } from './services/carteira/create-carteira'
import { getCarteiras, getCarteiraById } from './services/carteira/get-carteiras'
import { updateCarteira } from './services/carteira/update-carteira'
import { deleteCarteira } from './services/carteira/delete-carteira'

// Controllers de Receita
import { createReceita } from './services/receita/create-receita'
import { getReceitas, getReceitaById } from './services/receita/get-receitas'
import { updateReceita } from './services/receita/update-receita'
import { deleteReceita } from './services/receita/delete-receita'

// Controllers de Despesa
import { createDespesa } from './services/despesa/create-despesa'
import { getDespesas, getDespesaById } from './services/despesa/get-despesas'
import { updateDespesa } from './services/despesa/update-despesa'
import { deleteDespesa } from './services/despesa/delete-despesa'

// Controllers de Meta
import { createMeta } from './services/meta/create-meta'
import { getMetas, getMetaById } from './services/meta/get-metas'
import { updateMeta } from './services/meta/update-meta'
import { deleteMeta } from './services/meta/delete-meta'

export const  appRoutes = async  (app: FastifyInstance) =>{
    // Rota raiz
    app.get('/', async () => {
        return { message: 'API BagCoin - Gerenciador Financeiro' }
    })

    // Rotas de Usuário
    app.post('/users', createUser)
    app.get('/users/:id', getUserById)
    app.get('/users/carteira/:carteiraId', getUserByCarteira)

    // Rotas de Carteira
    app.post('/carteiras', createCarteira)
    app.get('/carteiras', getCarteiras)
    app.get('/carteiras/:id', getCarteiraById)
    app.put('/carteiras/:id', updateCarteira)
    app.delete('/carteiras/:id', deleteCarteira)

    // Rotas de Receita
    app.post('/receitas', createReceita)
    app.get('/receitas', getReceitas)
    app.get('/receitas/:id', getReceitaById)
    app.put('/receitas/:id', updateReceita)
    app.delete('/receitas/:id', deleteReceita)

    // Rotas de Despesa
    app.post('/despesas', createDespesa)
    app.get('/despesas', getDespesas)
    app.get('/despesas/:id', getDespesaById)
    app.put('/despesas/:id', updateDespesa)
    app.delete('/despesas/:id', deleteDespesa)

    // Rotas de Meta
    app.post('/metas', createMeta)
    app.get('/metas', getMetas)
    app.get('/metas/:id', getMetaById)
    app.put('/metas/:id', updateMeta)
    app.delete('/metas/:id', deleteMeta)
} 