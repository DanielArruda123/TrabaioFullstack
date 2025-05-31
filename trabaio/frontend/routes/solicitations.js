console.log("--- [BFF DEBUG] O arquivo routes/solicitations.js FOI CARREGADO --- " + new Date().toISOString());
const express = require('express');
const router = express.Router();
const { jwtDecode } = require('jwt-decode'); // Verifique se esta é a biblioteca correta e se você realmente precisa dela aqui ou se o token é apenas passado.

// URLs do seu backend principal (certifique-se que process.env.BACK_URL está definido)
const solicitationsBackendUrl = (process.env.BACK_URL || 'http://localhost:8080/api') + "/solicitations"; // Exemplo de fallback para BACK_URL
const tutorsBackendUrl = (process.env.BACK_URL || 'http://localhost:8080/api') + "/tutors";
const servicesBackendUrl = (process.env.BACK_URL || 'http://localhost:8080/api') + "/services";

// Função auxiliar para tratamento de erro de fetch (opcional, mas útil)
async function handleFetchError(resApi, bffRouteName) {
    const responseBodyText = await resApi.text();
    console.error(`[BFF] ${bffRouteName}: Erro ${resApi.status} do backend principal. Corpo: ${responseBodyText}`);
    let errorJson = { error: `Erro ${resApi.status} ao comunicar com o serviço: ${responseBodyText.substring(0, 300)}` };
    try { errorJson = JSON.parse(responseBodyText); } catch (e) { /* não era JSON */ }
    return { status: resApi.status, errorJson };
}


// GET: Listar todas as solicitações e dados para o formulário
router.get('/', async function (req, res, next) {
    const title = "Gestão de Solicitações";
    const cols = ["Tutor", "Pet(s)", "Serviço(s)", "Data/Hora", "Status"];
    const token = req.session.token || "";
    let currentUserRole = null;

    if (!token) return res.redirect('/login');

    try {
        const decodedToken = jwtDecode(token); // Cuidado com o uso direto no servidor se o token for complexo
        currentUserRole = decodedToken.role;
    } catch (error) {
        console.error("[BFF] Erro ao decodificar token em GET /solicitations:", error);
        return res.redirect('/login');
    }

    try {
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        const [solicitationsResponse, tutorsResponse, servicesResponse] = await Promise.all([
            fetch(solicitationsBackendUrl, { headers }),
            fetch(tutorsBackendUrl, { headers }),
            fetch(servicesBackendUrl, { headers })
        ]);

        if (!solicitationsResponse.ok) {
            const { status, errorJson } = await handleFetchError(solicitationsResponse, "GET /solicitations (list)");
            if (status === 401 || status === 403) return res.redirect('/login');
            throw errorJson;
        }
        const solicitations = await solicitationsResponse.json();

        let tutorsList = [];
        if (tutorsResponse.ok) tutorsList = await tutorsResponse.json();
        else console.warn(`[BFF] GET /solicitations (list): Erro ${tutorsResponse.status} ao buscar tutores: ${await tutorsResponse.text()}`);
        
        let servicesList = [];
        if (servicesResponse.ok) servicesList = await servicesResponse.json();
        else console.warn(`[BFF] GET /solicitations (list): Erro ${servicesResponse.status} ao buscar serviços: ${await servicesResponse.text()}`);

        res.render('layout', {
            body: 'pages/solicitations', title, cols, solicitations,
            tutors: tutorsList || [], services: servicesList || [],
            error: req.query.error || "", success: req.query.success || "",
            currentUserRole: currentUserRole
        });

    } catch (error) {
        console.error('[BFF] GET /solicitations (list): Erro CATCH:', error);
        res.render('layout', {
            body: 'pages/solicitations', title, cols,
            solicitations: [], tutors: [], services: [],
            error: error.message || error.error || "Erro ao carregar dados.",
            currentUserRole: currentUserRole
        });
    }
});

// POST: Criar nova solicitação
router.post("/", async (req, res) => {
    const token = req.session.token || "";
    if (!token) return res.status(401).json({ error: "Não autorizado: Token não fornecido" });

    // O frontend (mountSolicitationDataForm) já envia 'tutor', 'pet' (CSV), 'servico' (CSV), 'data_hora', 'status'
    const backendPayload = req.body; 
    console.log("[BFF] Rota POST /solicitations: Payload recebido do cliente:", JSON.stringify(backendPayload, null, 2));

    try {
        const apiResponse = await fetch(solicitationsBackendUrl, {
            method: "POST",
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(backendPayload)
        });

        const responseBodyText = await apiResponse.text();
        console.log(`[BFF] Rota POST /solicitations: Resposta do backend principal - Status: ${apiResponse.status}, Corpo: ${responseBodyText}`);
        
        if (!apiResponse.ok) {
            const { status, errorJson } = await handleFetchError(apiResponse, "POST /solicitations");
            return res.status(status).json(errorJson);
        }
        
        const newSolicitation = JSON.parse(responseBodyText);
        res.status(201).json(newSolicitation);

    } catch (error) {
        console.error("[BFF] Rota POST /solicitations: Erro CATCH:", error);
        res.status(500).json({ error: error.message || error.error || "Erro interno ao criar solicitação." });
    }
});

// GET: Buscar pets de um tutor específico
router.get('/fetch-pets-for-tutor/:tutorId', async (req, res) => {
    const token = req.session.token;
    const { tutorId } = req.params;
    console.log(`[BFF] Rota GET /fetch-pets-for-tutor/${tutorId} acessada.`);

    if (!token) return res.status(401).json({ error: 'Não autorizado.' });

    try {
        // Certifique-se que a URL do seu backend principal para buscar pets por tutor é esta:
        const backendApiUrl = `${tutorsBackendUrl}/${tutorId}/pets`; 
        console.log(`[BFF] Rota GET /fetch-pets-for-tutor/: Chamando backend principal URL: ${backendApiUrl}`);
        
        const apiResponse = await fetch(backendApiUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const responseBodyText = await apiResponse.text();
        console.log(`[BFF] Rota GET /fetch-pets-for-tutor/: Resposta do backend principal - Status: ${apiResponse.status}, Corpo: ${responseBodyText}`);

        if (!apiResponse.ok) {
            const { status, errorJson } = await handleFetchError(apiResponse, `GET /fetch-pets-for-tutor/${tutorId}`);
            return res.status(status).json(errorJson);
        }
        
        const pets = JSON.parse(responseBodyText);
        res.json(pets);

    } catch (error) {
        console.error("[BFF] Rota GET /fetch-pets-for-tutor/: Erro CATCH:", error);
        res.status(500).json({ error: 'Erro interno ao buscar pets.', details: error.message });
    }
});


// --- ROTAS PARA UM ÚNICO RECURSO PELO ID ---

// GET: Buscar uma solicitação por ID (para edição)
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const token = req.session.token || "";
    console.log(`[BFF] Rota GET /solicitations/${id} acessada.`);

    if (!token) return res.status(401).json({ error: "Não autorizado" });

    try {
        const targetUrl = `${solicitationsBackendUrl}/${id}`;
        console.log(`[BFF] Rota GET /solicitations/${id}: Chamando backend principal URL: ${targetUrl}`);
        const apiResponse = await fetch(targetUrl, {
            method: "GET",
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const responseBodyText = await apiResponse.text();
        console.log(`[BFF] Rota GET /solicitations/${id}: Resposta do backend principal - Status: ${apiResponse.status}, Corpo: ${responseBodyText}`);

        if (!apiResponse.ok) {
            const { status, errorJson } = await handleFetchError(apiResponse, `GET /solicitations/${id}`);
            return res.status(status).json(errorJson);
        }
        
        let solicitationData = JSON.parse(responseBodyText);

        // IMPORTANTE: Ajustar dados para o frontend se necessário
        // A função editSolicitation no frontend espera 'pets_solicitacao' e 'servicos_selecionados' como arrays de IDs.
        // Se seu backend principal retorna 'pet' e 'servico' como CSV, converta-os aqui.
        // Se o backend principal já retorna os IDs dos pets e serviços associados em campos como
        // 'pet_ids' (array) e 'servico_ids' (array), ou dentro de objetos aninhados, ajuste aqui.
        // Supondo que o backend principal retorna 'pet' (CSV) e 'servico' (CSV):
        if (solicitationData.pet && typeof solicitationData.pet === 'string') {
            solicitationData.pets_solicitacao = solicitationData.pet.split(',').map(petId => petId.trim()).filter(Boolean);
        } else if (Array.isArray(solicitationData.pet)) { // Ou se já for um array de IDs/objetos
            solicitationData.pets_solicitacao = solicitationData.pet.map(p => p.id || p).filter(Boolean);
        } else {
            solicitationData.pets_solicitacao = [];
        }

        if (solicitationData.servico && typeof solicitationData.servico === 'string') {
            solicitationData.servicos_selecionados = solicitationData.servico.split(',').map(serviceId => serviceId.trim()).filter(Boolean);
        } else if (Array.isArray(solicitationData.servico)) { // Ou se já for um array de IDs/objetos
            solicitationData.servicos_selecionados = solicitationData.servico.map(s => s.id || s).filter(Boolean);
        } else {
            solicitationData.servicos_selecionados = [];
        }
        // Certifique-se que solicitationData.tutor_id (ou campo similar) também está presente.
        // Se o backend principal retorna o tutor como um objeto, você pode precisar extrair o ID:
        // solicitationData.tutor_id = solicitationData.tutor.id || solicitationData.tutor;


        console.log(`[BFF] Rota GET /solicitations/${id}: Dados processados enviados para o frontend:`, solicitationData);
        res.json(solicitationData);

    } catch (error) {
        console.error(`[BFF] Rota GET /solicitations/${id}: Erro CATCH:`, error);
        res.status(500).json({ error: error.message || "Erro interno ao buscar dados da solicitação." });
    }
});

// PUT: Atualizar uma solicitação por ID
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const backendPayload = req.body; // O frontend já envia 'tutor', 'pet'(CSV), 'servico'(CSV) etc.
    const token = req.session.token || "";
    console.log(`[BFF] Rota PUT /solicitations/${id} acessada. Payload do cliente:`, JSON.stringify(backendPayload, null, 2));

    if (!token) return res.status(401).json({ error: "Não autorizado" });
    
    try {
        const targetUrl = `${solicitationsBackendUrl}/${id}`;
        console.log(`[BFF] Rota PUT /solicitations/${id}: Chamando backend principal URL: ${targetUrl}`);
        const apiResponse = await fetch(targetUrl, {
            method: "PUT",
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(backendPayload)
        });

        const responseBodyText = await apiResponse.text();
        console.log(`[BFF] Rota PUT /solicitations/${id}: Resposta do backend principal - Status: ${apiResponse.status}, Corpo: ${responseBodyText}`);
        
        if (!apiResponse.ok) {
            const { status, errorJson } = await handleFetchError(apiResponse, `PUT /solicitations/${id}`);
            return res.status(status).json(errorJson);
        }
        
        const updatedSolicitation = JSON.parse(responseBodyText);
        res.json(updatedSolicitation);

    } catch (error) {
        console.error(`[BFF] Rota PUT /solicitations/${id}: Erro CATCH:`, error);
        res.status(500).json({ error: error.message || "Erro interno ao atualizar solicitação." });
    }
});

// DELETE: Excluir uma solicitação por ID
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const token = req.session.token || "";
    console.log(`[BFF] Rota DELETE /solicitations/${id} acessada.`);

    if (!token) return res.status(401).json({ error: "Não autorizado" });

    try {
        const targetUrl = `${solicitationsBackendUrl}/${id}`;
        console.log(`[BFF] Rota DELETE /solicitations/${id}: Chamando backend principal URL: ${targetUrl}`);
        const apiResponse = await fetch(targetUrl, {
            method: "DELETE",
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log(`[BFF] Rota DELETE /solicitations/${id}: Resposta do backend principal - Status: ${apiResponse.status}`);

        if (!apiResponse.ok) { // Mesmo para DELETE, um erro pode ter corpo
            const { status, errorJson } = await handleFetchError(apiResponse, `DELETE /solicitations/${id}`);
            return res.status(status).json(errorJson);
        }
        
        if (apiResponse.status === 204) { // No Content
            res.status(204).send();
        } else { // Se houver corpo (ex: mensagem de sucesso)
            const responseBodyText = await apiResponse.text(); // Ler se não for 204
            try {
                const result = JSON.parse(responseBodyText);
                res.json(result);
            } catch (e) {
                res.send(responseBodyText); // Envia como texto se não for JSON
            }
        }
    } catch (error) {
        console.error(`[BFF] Rota DELETE /solicitations/${id}: Erro CATCH:`, error);
        res.status(500).json({ error: error.message || "Erro interno ao deletar solicitação." });
    }
});

module.exports = router;