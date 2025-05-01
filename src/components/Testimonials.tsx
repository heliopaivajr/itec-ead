
import React from 'react';

const testimonials = [
  {
    quote: "O curso de Teologia do ITEC transformou minha visão ministerial. A qualidade do conteúdo e o suporte dos professores fizeram toda a diferença na minha formação.",
    author: "Pastor Ricardo Almeida",
    role: "Igreja Batista Central",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80"
  },
  {
    quote: "Mesmo à distância, pude sentir o cuidado espiritual e acadêmico em cada aula. A plataforma é intuitiva e o conteúdo é profundo e transformador.",
    author: "Missionária Ana Ferreira",
    role: "Campo missionário na África",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80"
  },
  {
    quote: "Como líder de jovens, o curso me preparou para responder às questões desta geração com fundamento bíblico sólido e abordagem contemporânea.",
    author: "Lucas Mendes",
    role: "Ministério de Jovens",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80"
  }
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-itec-blue via-itec-blue/95 to-itec-blue text-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="font-merriweather font-bold text-3xl lg:text-4xl mb-4">
            O Que Nossos Alunos Dizem
          </h2>
          <p className="text-white/80 max-w-3xl mx-auto">
            Depoimentos de pessoas que tiveram suas vidas e ministérios transformados através da nossa formação teológica.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-white/10 backdrop-blur-sm p-6 rounded-lg shadow border border-white/20 relative"
            >
              <svg className="absolute top-4 left-4 h-8 w-8 text-white/20 transform -rotate-180" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
                <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
              </svg>
              
              <div className="pt-8">
                <p className="text-white mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.author} 
                    className="w-10 h-10 rounded-full mr-4 object-cover"
                  />
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-white/70 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
