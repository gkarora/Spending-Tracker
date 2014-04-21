CONTENTS := web_server.py server.py

ASSOCIATION_FILES := .hostname .cookies

CONTENTS_EXEC := activate

CONFIGURATION_WEB := home.html enterData.html header.html datachart.html util.js style.css

CONFIGURATION := configuration/service-id.json

ARCHIVE := archive.tar.bz2

BUILD = build

.PHONY = all dist clean install

all: dist

dist: install $(ARCHIVE)

install: $(CONTENTS) $(CONTENTS_EXEC) $(CONFIGURATION) $(CONTENTS_WEB)
	rm -rf $(BUILD)/
	install -m 755 -d $(BUILD)
	install -m 755 -d $(BUILD)/pub
	install -m 755 -d $(BUILD)/configuration
	install -m 644 $(CONTENTS)            $(BUILD)/
	install -m 755 $(CONTENTS_EXEC)       $(BUILD)/
	install -m 644 $(CONFIGURATION_WEB)   $(BUILD)/pub
	install -m 644 $(CONFIGURATION)       $(BUILD)/configuration


$(ARCHIVE): $(BUILD)
	rm -f $@
	tar -cjvf $@ -C $(BUILD) .

clean:
	rm -r $(ARCHIVE)

associate $(ASSOCIATION_FILES):
	./associate.sh

disassociate:
	rm -f $(ASSOCIATION_FILES)

upload: all $(ASSOCIATION_FILES)
	curl --cookie .cookies -X POST -H "Content-Type: application/bzip2" --data-binary @archive.tar.bz2 https://$(shell cat .hostname)/usrvplatform/developer/douploadarchive

deactivate: $(ASSOCIATION_FILES)
	curl --cookie .cookies -X POST https://$(shell cat .hostname)/usrvplatform/developer/dodeactivate

reset: $(ASSOCIATION_FILES)
	curl --cookie .cookies -X POST https://$(shell cat .hostname)/usrvplatform/developer/doreset
