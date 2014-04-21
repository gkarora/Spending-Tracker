import json
import sys
import httplib
import BaseHTTPServer
import socket
import urlparse
import web_server
import shutil
import os
import sqlite3
import errno
import traceback

def run(handler_class, port):
    server_address = ('', port)
    httpd = BaseHTTPServer.HTTPServer (server_address, handler_class)
    httpd.serve_forever()

conn = sqlite3.connect(r"spending.db")
conn.commit()
conn.close()

class Handler(BaseHTTPServer.BaseHTTPRequestHandler, web_server.BaseHandler):
  server_version = "test/0.1"

  def loadFile(self, fileName):
    try:
      f=open(fileName)
    except:
      try:      
        fileName="/usr/service/pub/"+fileName   
        f=open(fileName)
      except IOError as err:
        if err.errno != errno.ENOENT:
          traceback.print_exc()
          self.web_error(httplib.INTERNAL_SERVER_ERROR, "Unexpected exception")
        else:
          self.web_error(httplib.NOT_FOUND)
        
    contents=f.readlines()
    f.close()
    self.loadFile2(contents, fileName)
 
  def loadFile2 (self, contents, pathelem):
    self.send_response(httplib.OK)
    if "style.css" in pathelem:
      self.send_header("content-type", "text/css")
    else:    
      self.send_header("content-type", "text/html")
    self.send_header("content-length", os.path.getsize(pathelem))
    self.end_headers()
    self.wfile.writelines(contents)

  def do_GET(self):
      path_elements=self.path.split('/')[1:]

      if path_elements[0] =='':
      # entry point
        self.send_response(httplib.FOUND)
        self.send_header("Location", "home.html")
        self.end_headers()
     
      elif path_elements[0]=='datachart.html':
        data = open('data.txt', 'w')        
        try:
          db = sqlite3.connect('spending.db')
          cursor = db.cursor()
          cursor.execute('''
              SELECT * FROM Spending ORDER BY date DESC''')
          

          for row in cursor.fetchall():
            data.write(str(row[0])+', '+str(row[1])+', '+str(row[2])+', '+
                      str(row[3])+ ', '+str(row[4])+'\n')
          db.close()
        except:
          data.write("")
        
        data.close()
        
        self.loadFile(path_elements[0])
      
      else:   
        self.loadFile(path_elements[0])



  def do_POST(self):
    # Request for the platform
    path_elements=self.path.split('/')[1:]  
    
    if path_elements[0] == 'datachart.html':
        # parse information in form
        form_values = self.read_x_www_form_urlencoded_request_body()
        amountSpent = self.single_value(form_values, 'amountSpent', "form")
        memo = self.single_value(form_values, 'memo', "form")
        date = self.single_value(form_values, 'date', "form")
        user = self.headers.getheader('usrv-username')
        if amountSpent is None or memo is None:
            self.web_error(httplib.BAD_REQUEST, 
                  "Bad form, must provide all information")
        else: 
            db = sqlite3.connect('spending.db')
            cursor = db.cursor()
            cursor.execute('''
                CREATE TABLE if not exists Spending 
                    (id INTEGER primary key autoincrement, 
                    date DATE, amount INTEGER, memo TEXT, user TEXT)''')
            cursor.execute ('''
                INSERT INTO Spending(amount, date, memo, user)
                VALUES(?,?,?,?)''',(amountSpent, date, memo, user))
            db.commit()
            db.close()

            self.send_response(httplib.FOUND)
            self.send_header("Location", "/datachart.html")
            self.end_headers()

  def do_DELETE(self):
    path_elements=self.path.split('/')[1:]
    if path_elements[0]=='datachart.html':      
        raw_body = self.read_request_body()
        form_values=urlparse.parse_qs(raw_body)
        delID=form_values['idr']
        
        db = sqlite3.connect('spending.db')
        cursor = db.cursor()
        cursor.execute('''DELETE FROM Spending WHERE id='''+str(delID[0]))
        db.commit()
        db.close()
        
        self.send_response(httplib.SEE_OTHER)
        self.send_header("Location", "/datachart.html")
        self.end_headers()

if __name__ == '__main__':
    port = int(sys.argv[1])
    run(Handler, port)  
