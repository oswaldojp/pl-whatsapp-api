import { response } from 'express';
import whatsappService from './whatsappService.js';
import appendToSheet from './googleSheetService.js';  
import openAiService from './openAiService.js';

class MessageHandler {

  constructor() {
    this.appointmentState = {};
    this.assistantState = {};
  }

  async handleIncomingMessage(message, senderInfo) {
    if (message?.type === 'text') {
      const incomingMessage = message.text.body.toLowerCase().trim();

      if (this.isGreeting(incomingMessage)) {
        await this.sendWelcomeMessage(message.from, senderInfo?.profile?.name, message.id);
        await this.sendWelcomeMenu(message.from);
      }else if(incomingMessage == 'media'){
        await this.sendMediaMessage(message.from);
      }
      else if (this.appointmentState[message.from]) { 
        await this.handleAppointmentFlow(message.from, incomingMessage);
      }
      else if (this.assistantState[message.from]) { 
        await this.handleAssistantFlow(message.from, incomingMessage);
      }
      else{
        //const response = `Echo: ${message.text.body}`;
        //await whatsappService.sendMessage(message.from, response/*, message.id*/);
        await this.handleMenuOption(message.from, incomingMessage);
      }
      await whatsappService.markAsRead(message.id);
    }
    else if (message?.type === 'interactive') {
      // Handle interactive messages (button clicks)
      //const selectedOption = message?.interactive?.button_id;
      //const option = message?.interactive?.button_reply?.title.toLowerCase().trim();
      const option = message?.interactive?.button_reply?.id;
      await this.handleMenuOption(message.from, option, message.id);
      await whatsappService.markAsRead(message.id);
      //await this.handleMenuSelection(message.from, selectedOption);
    }
  }

  isGreeting(message) {
    const greetings = ['hi', 'hello', 'hey', 'greetings', 'hola', 'buenos días', 'buenas tardes', 'buenas noches'];
    return greetings.includes(message.toLowerCase());
  }

  async sendWelcomeMessage(to, senderName/*, messageId*/) {
    //const welcomeMessage = `Hello ${senderName || 'there'}! Welcome to our service. How can we assist you today?`;
    const welcomeMessage = `Hola ${senderName || 'there'}! Bienvenido a MEDPET, Tu tienda de mascotas en línea. ¿En qué puedo ayudarte hoy?`;
    await whatsappService.sendMessage(to, welcomeMessage/*, messageId*/);
    //await whatsappService.markAsRead(messageId);
  }

  async sendWelcomeMenu(to){
    const menuMessage = "Elije una Opción:";
    const buttons = [
      { type: 'reply', reply: {id: 'option_1', title: 'Agendar'} },
      { type: 'reply', reply: {id: 'option_2', title: 'Consultar'} },
      { type: 'reply', reply: {id: 'option_3', title: 'Ubicación'} }
    ];
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async handleMenuOption(to, option, id) {
    console.log(option);
    let response;
    switch (option) {
      //case 'agendar':
      case 'option_1':
        this.appointmentState[to] = {step: 'name'};
        response = "Por favor ingresa tu nombre: "
        //await whatsappService.sendMessage(to, 'Has seleccionado Agendar. ¿Qué fecha prefieres?', id);
        break;
      //case 'consultar':
      case 'option_2':
        this.assistantState[to] = { step: 'question' };
        response = 'Realiza tu consulta';
        //await whatsappService.sendMessage(to, 'Has seleccionado Consultar. ¿Sobre qué tema necesitas información?', id);
        break;
      //case 'ubicación':
      case 'option_3':
        response = 'Te esperamos en nuestra sucursal:';
        await this.sendLocation(to);
        //await whatsappService.sendMessage(to, 'Has seleccionado Ubicación. Aquí tienes nuestra dirección: [dirección]', id);
        break;
      //case 'emergencia':
      case 'option_6':
        response = 'Si es una emergencia, por favor llama a nuestra línea de atención.';
        await this.sendContact(to);
        break;
      default:
        response = 'Lo siento no entendi tu selección, elije una opción del menú.';
        //await whatsappService.sendMessage(to, 'Opción no válida. Por favor, elige una opción del menú.', id);
    }
    await whatsappService.sendMessage(to, response/*, id*/);
  }

  async sendMediaMessage(to) {
        // const mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-audio.aac';
    // const caption = 'Bienvenida';
    // const type = 'audio';

    const mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-imagen.png';
    const caption = '¡Esto es una Imagen!';
    const type = 'image';

    // const mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-video.mp4';
    // const caption = '¡Esto es una video!';
    // const type = 'video';

    // const mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-file.pdf';
    // const caption = '¡Esto es un PDF!';
    // const type = 'document';

    await whatsappService.sendMediaMessage(to, type, mediaUrl, caption);
  }

  completeAppointment(to){
    const appointment = this.appointmentState[to];
    // Aquí puedes manejar la lógica para completar la cita, como guardar en la base de datos, etc.
    delete this.appointmentState[to];

    const userData = [
      to,
      appointment.name,
      appointment.petName,
      appointment.petType,
      appointment.reason,
      new Date().toISOString()
    ];

    //console.log('Cita completada:', userData);
    appendToSheet(userData);

    return `Gracias por agendar tu cita.
    Resumen de tu cita:

    Nombre: ${appointment.name}
    Nombre de la mascota: ${appointment.petName}
    Tipo de mascota: ${appointment.petType}
    Motivo de la cita: ${appointment.reason}
    
    Nos pondremos en contacto contigo pronto para confirmar la fecha y hora de tu cita.`

  }

  async handleAppointmentFlow(to, message){
    const state = this.appointmentState[to];
    let response;
    //console.log('llegue al handleAppointmentFlow');
    switch (state.step){
      case 'name':
        state.name = message;
        state.step = 'petName';
        response = 'Gracias, Ahora, ¿Cuál es el nombre de tu mascota?';
        break;
      case 'petName':
        state.petName = message;
        state.step = 'petType';
        response = '¿Que tipo de mascota es? (por ejemplo: perro, gato, etc.)';
        break;
      case 'petType':
        state.petType = message;
        state.step = 'reason';
        response = '¿Cuál es el motivo de la cita?';
        break;
      case 'reason':
        state.reason = message;
        //state.step = 'date';
        //response = 'Gracias por agendar tu cita. Te contactaremos pronto con los detalles.';
        response = this.completeAppointment(to);
        break;
    }
    //console.log('Voy a enviar el mensaje:', response, message.id, to);
    await whatsappService.sendMessage(to, response/*, message.id*/);
  }

  async handleAssistantFlow(to, message){ 
    const state = this.assistantState[to];
    let response;

    const menuMessage = "La respuesta fué de tu ayuda?";
    const buttons = [
      { type: 'reply', reply: {id: 'option_4', title:'Si, gracias'} },
      { type: 'reply', reply: {id: 'option_5', title:'Hacer otra pregunta'} }, //Los títulos de los botones no deben tener más de 20 caracteres
      { type: 'reply', reply: {id: 'option_6', title:'Emergencia'} }
    ];

    if(state.step === 'question') {
      response = await openAiService(message);
    }

    delete this.assistantState[to];
    await whatsappService.sendMessage(to, response);
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async sendContact(to){
    const contact = {
      addresses: [
        {
          street: "123 Calle de las Mascotas",
          city: "Ciudad",
          state: "Estado",
          zip: "12345",
          country: "País",
          country_code: "PA",
          type: "WORK"
        }
      ],
      emails: [
        {
          email: "contacto@medpet.com",
          type: "WORK"
        }
      ],
      name: {
        formatted_name: "MedPet Contacto",
        first_name: "MedPet",
        last_name: "Contacto",
        middle_name: "",
        suffix: "",
        prefix: ""
      },
      org: {
        company: "MedPet",
        department: "Atención al Cliente",
        title: "Representante"
      },
      phones: [
        {
          phone: "+1234567890",
          wa_id: "1234567890",
          type: "WORK"
        }
      ],
      urls: [
        {
          url: "https://www.medpet.com",
          type: "WORK"
        }
      ]
    };
    await whatsappService.sendContactMessage(to, contact);
  }

  async sendLocation(to){
    const latitude = 6.2071694;
    const longitude = -75.574607;
    const name = 'Platzi Medellín';
    const address = 'Cra. 43A #5A - 113, El Poblado, Medellín, Antioquia.'

    await whatsappService.sendLocationMessage(to, latitude, longitude, name, address);
  }
}

export default new MessageHandler();