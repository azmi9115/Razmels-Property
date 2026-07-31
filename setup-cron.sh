chmod +x /usr/local/bin/auto-heal.sh
crontab -l > mycron 2>/dev/null || true
grep -v "auto-heal.sh" mycron > mycron.tmp
echo "* * * * * /usr/local/bin/auto-heal.sh" >> mycron.tmp
crontab mycron.tmp
rm mycron mycron.tmp
