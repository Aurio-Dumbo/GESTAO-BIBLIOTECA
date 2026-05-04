FROM nginx:1.27-alpine

# Remover configuração padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar configuração personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar ficheiros estáticos do frontend
COPY . /usr/share/nginx/html

EXPOSE 80
