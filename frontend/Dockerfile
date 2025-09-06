# Use Nginx to serve pre-built Angular app
FROM nginx:alpine

# Remove default Nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy pre-built Angular app
COPY dist/intelliinspect/ /usr/share/nginx/html/

# Copy custom nginx.conf to enable large file uploads
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
