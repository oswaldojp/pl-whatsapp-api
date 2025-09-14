import axios from "axios";
import config from "../../config/env.js";

const sendtOWhatsApp = async (data) => {
    const baseUrl = `${config.BASE_URL}${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`;
    const headers = {
        Authorization: `Bearer ${config.API_TOKEN}`,
        'Content-Type': 'application/json',
    };
    try {
        const response = await axios({
            method: 'POST',
            url: baseUrl,
            headers: headers,
            data: data,
        });
        return response.data;
    } catch (error) {
        console.error('Error sending message to WhatsApp:', error);
    }
};

export default sendtOWhatsApp;
